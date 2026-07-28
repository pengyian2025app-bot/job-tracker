// Supabase Edge Function: 面试题生成器
// 接收公司+岗位，调用 Qwen 生成结构化面试题
// 部署：supabase functions deploy interview-questions --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DASHSCOPE_API_KEY = Deno.env.get('DASHSCOPE_API_KEY');
const QWEN_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

const SYSTEM_PROMPT = `你是一位资深的技术面试官，擅长根据岗位和公司预测面试题。

用户会告诉你公司名和岗位名，请生成 10 道可能出现的面试题，分 3 类：
1. 技术题（4 道）：岗位相关的技术问题
2. 项目题（3 道）：深挖简历项目的问题
3. 行为面试题（3 道）：软技能、动机、团队协作

每道题包含：
- question: 题目
- category: 技术/项目/行为
- hint: 答题要点（2-3 句话）

严格按以下 JSON 格式返回（不要任何其他文字、Markdown、代码块）：

{
  "questions": [
    {
      "category": "技术",
      "question": "...",
      "hint": "..."
    }
  ]
}

只返回JSON，不要任何解释。`;

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
    if (!DASHSCOPE_API_KEY) {
      throw new Error('DASHSCOPE_API_KEY 未配置');
    }

    const { company, position } = await req.json();
    if (!position) throw new Error('缺少 position 参数');

    const userText = company
      ? `公司：${company}\n岗位：${position}\n\n请生成 10 道面试题。`
      : `岗位：${position}\n\n请生成 10 道面试题。`;

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

    if (!content) {
      throw new Error('Qwen 返回数据异常：' + JSON.stringify(qwenData).slice(0, 200));
    }

    let text = typeof content === 'string' ? content : (content.text || '');
    let parsed;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || text.match(/(\{[\s\S]*\})/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[1]);
      else throw new Error('无法提取 JSON。原始返回：' + text.slice(0, 300));
    }

    return new Response(
      JSON.stringify({ success: true, data: parsed }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});