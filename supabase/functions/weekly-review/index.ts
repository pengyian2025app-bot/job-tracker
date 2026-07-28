// Supabase Edge Function: 周报生成器
// 接收一周的复盘文本，调用 Qwen 生成求职周报
// 部署：supabase functions deploy weekly-review --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DASHSCOPE_API_KEY = Deno.env.get('DASHSCOPE_API_KEY');
const QWEN_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

const SYSTEM_PROMPT = `你是一位温暖的求职陪伴导师，擅长帮候选人整理一周的心路历程。

用户会给你一周（7 天）的求职复盘。每天可能包含：
- 当天投递/面试的公司
- 心情、感受、焦虑
- 学到的东西
- 第二天的计划

请生成一份"求职周报"，包括：

严格按以下 JSON 格式返回（不要任何其他文字、Markdown、代码块）：

{
  "overview": "本周整体总结（3-5 句话）",
  "achievements": ["本周亮点1", "本周亮点2", "本周亮点3"],
  "moodTrend": "情绪趋势分析（从复盘中推测：整体是焦虑/平稳/积极？）",
  "suggestions": [
    "下周建议1：具体可执行",
    "下周建议2",
    "下周建议3"
  ],
  "encouragement": "一句温暖的话，给候选人打气"
}

注意：
- 语气温暖但不过度鸡汤
- suggestions 要具体可执行
- encouragement 简短有力（不要超过 30 字）

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

    const { journals } = await req.json();
    if (!journals || !journals.length) throw new Error('缺少 journals 参数');

    const sorted = [...journals].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const userText = `【本周复盘】\n${sorted.map(j => `${j.date}：${j.content}`).join('\n\n')}\n\n请生成求职周报。`;

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