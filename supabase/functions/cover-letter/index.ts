// Supabase Edge Function: 投递信草稿生成
// 接收公司+岗位+简历+风格，调用 Qwen 生成 3 封不同风格的邮件
// 部署：supabase functions deploy cover-letter --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DASHSCOPE_API_KEY = Deno.env.get('DASHSCOPE_API_KEY');
const QWEN_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

const SYSTEM_PROMPT = `你是一位求职顾问，擅长写个性化的求职邮件。
用户会告诉你：候选人简历、目标公司、目标岗位。
请生成 3 封不同风格的求职邮件（中文）：

风格 1 - 专业稳重：
- 体现职业素养，正式但不生硬
- 突出与岗位高度匹配的经验
- 适合外企、金融、国企

风格 2 - 热情真诚：
- 体现对公司和岗位的真实兴趣
- 故事化表达，HR 一眼能记住
- 适合创业公司、互联网公司

风格 3 - 简洁有力：
- 不啰嗦，直接亮核心匹配点
- 适合技术岗、时间宝贵的 HR

每封邮件包含：
- subject: 邮件标题
- body: 邮件正文（300-500 字，不要过长）
- 称呼 + 自我介绍 + 匹配点 + 表达意向 + 结束语

严格按以下 JSON 格式返回（不要任何其他文字、Markdown、代码块）：

{
  "letters": [
    {
      "style": "专业稳重",
      "subject": "应聘 XX 岗位 - 张三",
      "body": "尊敬的 HR 老师，\\n\\n您好，\\n\\n我是...\\n\\n此致\\n敬礼\\n\\n张三"
    }
  ]
}

只返回JSON。邮件 body 用 \\n 表示换行。`;

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

    const { resume, company, position, jd = '' } = await req.json();
    if (!resume || !position) throw new Error('缺少 resume 或 position 参数');

    const userText = `【候选人简历】\n${resume}\n\n【目标公司】${company || '未指定'}\n【目标岗位】${position}\n${jd ? `【JD 描述】\n${jd}\n` : ''}\n请生成 3 封不同风格的求职邮件。`;

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