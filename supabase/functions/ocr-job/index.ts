// Supabase Edge Function: 批量识别职位截图
// 接收 base64 图片，调用阿里云 Qwen-VL，返回多条职位记录
// 部署：supabase functions deploy ocr-job --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DASHSCOPE_API_KEY = Deno.env.get('DASHSCOPE_API_KEY');
const QWEN_VL_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

// 支持两种模式：
// - mode='single'（默认）：单条记录识别，返回 { company, position, salary, ... }
// - mode='batch'：批量识别，返回 { jobs: [{...}, {...}] }

const SYSTEM_PROMPT_SINGLE = `你是一个招聘信息识别助手。用户会给你一张截图，可能是招聘网站详情页、HR聊天记录等。
请仔细识别图中信息，严格按以下 JSON 格式返回（不要任何其他文字、Markdown、代码块）：

{
  "company": "公司名（必填）",
  "position": "职位名称（必填）",
  "salary": "薪资范围（如'25-40K·14薪'，没有就留空）",
  "location": "工作地点（没有就留空）",
  "deadline": "截止日期（YYYY-MM-DD格式，没有就留空）",
  "link": "职位链接URL（没有就留空）",
  "enterprise_type": "企业性质（民企/央企国企/外企/事业单位/银行/其他，没有就留空）",
  "industry": "所属行业（IT/互联网/通信/电子/半导体/AI/金融/制造等常见分类，没有就留空）",
  "update_date": "信息更新日期（YYYY-MM-DD格式，飞书表格的'更新日期'列，没有就留空）",
  "notes": "其他有用信息（HR名字、面试时间、岗位亮点等，没有就留空）"
}

只返回JSON，不要任何解释。`;

const SYSTEM_PROMPT_BATCH = `你是招聘信息批量识别助手。用户会给你一张表格截图（飞书/Excel），包含多家公司。

⚠️ 重要：表格有多个日期列，必须严格区分：
- **更新日期**：表格最左侧的"更新日期"列，记录这条信息何时被录入到表格（例如 2026/07/24）
- **截止日期**：表格中部的"截止时间"列，是投递的 DDL（例如 2026/09/15）
- 这两个是完全不同的概念，**不要互相混淆**！

请仔细识别图中所有公司信息，每家公司一条记录。

严格按以下 JSON 格式返回（不要任何其他文字、Markdown、代码块）：

{
  "jobs": [
    {
      "company": "公司名",
      "position": "可投岗位（多个用逗号分隔，没有就留空）",
      "location": "工作地点（多个用逗号分隔，没有就留空）",
      "deadline": "截止日期 YYYY-MM-DD（对应表格的'截止时间'列，没有就留空字符串）",
      "enterprise_type": "企业性质（民企/央企国企/外企/事业单位/银行/其他，没有就留空）",
      "industry": "所属行业（IT/互联网/通信/电子/半导体/AI/金融/制造等常见分类，没有就留空）",
      "update_date": "信息更新日期 YYYY-MM-DD（对应表格最左侧的'更新日期'列，记录这条信息何时被加入表格，没有就留空字符串）",
      "level": "招聘类型（27届秋招/26届春招/实习等，没有就留空）",
      "notes": "其他有用信息（没有就留空）"
    }
  ]
}

注意：
- 每一行/每一条记录都对应一家公司
- "更新日期"和"截止日期"是完全不同的两列，**不要混淆**！
- 如果某个日期在原图看不清，就留空字符串，不要猜
- 所有日期都转成 YYYY-MM-DD 格式（例如原图是 "2026/07/24" 就输出 "2026-07-24"）
- 如果表格有"层次"列（27届/26届等），识别出来
- 找不到的字段留空字符串
- 只返回JSON，不要任何解释`;

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

    const { imageBase64, mimeType = 'image/png', mode = 'single' } = await req.json();

    if (!imageBase64) {
      throw new Error('缺少 imageBase64 参数');
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const systemPrompt = mode === 'batch' ? SYSTEM_PROMPT_BATCH : SYSTEM_PROMPT_SINGLE;

    const qwenRes = await fetch(QWEN_VL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-vl-plus',
        input: {
          messages: [
            { role: 'system', content: [{ text: systemPrompt }] },
            {
              role: 'user',
              content: [
                { image: `data:${mimeType};base64,${base64Data}` },
                { text: mode === 'batch'
                    ? '请识别这张表格截图里的所有公司，返回JSON数组。'
                    : '请识别这张截图里的招聘信息，返回JSON。' },
              ],
            },
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

    let text = '';
    if (Array.isArray(content)) {
      text = content.map(c => c.text || '').join('\n');
    } else if (typeof content === 'string') {
      text = content;
    } else if (content.text) {
      text = content.text;
    }

    let parsed;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || text.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('无法提取 JSON。原始返回：' + text.slice(0, 300));
      }
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