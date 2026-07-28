// Supabase Edge Function: 面试复盘助手
// 接收面试复盘文本 + 公司岗位，输出结构化复盘报告
// 部署：supabase functions deploy interview-review --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DASHSCOPE_API_KEY = Deno.env.get('DASHSCOPE_API_KEY');
const QWEN_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

const SYSTEM_PROMPT = `你是求职辅导专家，擅长帮候选人做面试复盘。

用户会给你：
1. 候选人面试的复盘（可能是录音转写、笔记或口述）
2. 公司名
3. 岗位名

请从这份复盘中提取关键信息，输出结构化复盘报告：

严格按以下 JSON 格式返回（不要任何其他文字、Markdown、代码块）：

{
  "summary": "整体评价（3-5 句话，给候选人一个总体的客观评价）",
  "highlights": [
    "亮点1：做得好的地方",
    "亮点2",
    "亮点3"
  ],
  "improvements": [
    "改进1：具体可执行的改进点",
    "改进2",
    "改进3"
  ],
  "qa": [
    {"question": "被问到的问题", "answer": "候选人的回答要点", "feedback": "这个回答的反馈"}
  ],
  "nextPrep": [
    "下次面试准备建议1",
    "下次面试准备建议2",
    "下次面试准备建议3"
  ],
  "tags": ["技术扎实", "表达清晰", ...]  // 3-5 个评价标签
}

注意：
- 提取复盘中提到的 Q&A 问答对（最多 5 个）
- 如果复盘中没提到具体问答，qa 数组可以为空
- 改进建议要具体可执行（不能是"提升表达"这种空话）
- tags 是简短的标签词

只返回JSON。`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    if (!DASHSCOPE_API_KEY) throw new Error('DASHSCOPE_API_KEY 未配置');

    const { company, position, review } = await req.json();
    if (!review) throw new Error('缺少 review 参数');
    if (review.length < 30) throw new Error('复盘内容太短（至少 30 字）');

    const userText = `【公司】${company || '未指定'}\n【岗位】${position || '未指定'}\n\n【面试复盘】\n${review}\n\n请输出结构化复盘报告。`;

    const qwenRes = await fetch(QWEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userText },
          ],
        },
        parameters: { result_format: 'message' },
      }),
    });

    if (!qwenRes.ok) {
      const errText = await qwenRes.text();
      throw new Error(`Qwen API 错误 (${qwenRes.status}): ${errText.slice(0, 200)}`);
    }

    const qwenData = await qwenRes.json();
    const content = qwenData?.output?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Qwen 返回异常');

    let text = typeof content === 'string' ? content : (content.text || '');
    let parsed;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      const m = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || text.match(/(\{[\s\S]*\})/);
      if (m) parsed = JSON.parse(m[1]);
      else throw new Error('无法解析 JSON：' + text.slice(0, 300));
    }

    return new Response(
      JSON.stringify({ success: true, data: parsed }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
});