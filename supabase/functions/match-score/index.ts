// Supabase Edge Function: 岗位匹配度评分
// 接收简历+JD，调用 Qwen 评估匹配度
// 部署：supabase functions deploy match-score --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DASHSCOPE_API_KEY = Deno.env.get('DASHSCOPE_API_KEY');
const QWEN_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

const SYSTEM_PROMPT = `你是一位资深的技术招聘官，擅长评估候选人与岗位的匹配度。

用户会给你：
1. 候选人简历
2. 目标岗位的 JD（职位描述）

请从以下几个维度评估匹配度（0-100 分）：
- 技能匹配：JD 要求的技术栈 vs 候选人掌握的技术
- 经验匹配：项目经验 vs JD 期望的经验水平
- 行业匹配：候选人经历的行业 vs JD 所在行业
- 学历匹配：候选人学历 vs JD 学历要求
- 软技能匹配：沟通、团队、学习能力等

请严格按以下 JSON 格式返回（不要任何其他文字、Markdown、代码块）：

{
  "score": 85,  // 总分 0-100
  "level": "强烈推荐" | "推荐" | "一般" | "不推荐",  // 根据分数自动判断
  "highlights": ["强项1", "强项2", "强项3"],
  "weaknesses": ["弱项1", "弱项2", "弱项3"],
  "suggestions": ["建议1：具体可执行", "建议2", "建议3"],
  "summary": "一句话总结匹配情况"
}

评分标准：
- 90+：强烈推荐，技能+经验+行业全方位匹配
- 75-89：推荐，主要维度匹配，有 1-2 个小短板
- 60-74：一般，部分匹配，需要补强
- 60 以下：不匹配，差距较大

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
    if (!DASHSCOPE_API_KEY) throw new Error('DASHSCOPE_API_KEY 未配置');

    const { resume, jd } = await req.json();
    if (!resume || !jd) throw new Error('缺少 resume 或 jd 参数');

    const userText = `【候选人简历】\n${resume}\n\n【目标岗位 JD】\n${jd}\n\n请评估匹配度，返回 JSON。`;

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