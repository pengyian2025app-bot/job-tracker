// Supabase Edge Function: 公司名去重判断
// 接收一个新公司名 + 已有公司名列表，调用 Qwen 判断是否重复
// 部署：supabase functions deploy dedup-company --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DASHSCOPE_API_KEY = Deno.env.get('DASHSCOPE_API_KEY');
const QWEN_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

const SYSTEM_PROMPT = `你是数据清洗专家，擅长判断不同写法是否指向同一家公司。

用户会给你：
1. 一个新公司名
2. 已有公司名列表

请判断新公司名是否与列表中的某一项指向**同一家公司**。考虑：
- 中英文别名（如"字节跳动"和"ByteDance"）
- 简称和全称（如"腾讯"和"深圳市腾讯计算机系统有限公司"）
- 子公司/母公司（如"抖音"和"字节跳动"，但"抖音"是产品不是公司）
- 地区前缀/后缀差异（如"阿里"和"阿里巴巴"）
- **但是**不同公司要严格区分（如"字节跳动"和"腾讯"不是同一家）

严格按以下 JSON 格式返回（不要任何其他文字、Markdown、代码块）：

{
  "duplicate": true/false,
  "matchedIndex": 2,
  "reason": "判断理由"
}

只返回JSON，不要任何解释。`;

const SYSTEM_PROMPT_BATCH = `你是数据清洗专家。用户会给你一组公司名，找出里面指向**同一家**的公司组。

例如输入：
- 字节跳动
- ByteDance
- 腾讯
- 深圳市腾讯计算机系统有限公司
- 阿里巴巴

返回：
{
  "groups": [
    ["字节跳动", "ByteDance"],
    ["腾讯", "深圳市腾讯计算机系统有限公司"],
    ["阿里巴巴", "阿里"]
  ]
}

注意：
- 只把**真的指向同一家**的放一组
- 不同的公司不要放一组
- 没重复的公司不用出现

严格按以下 JSON 格式返回：

{
  "groups": [
    ["公司A", "公司B"],
    ["公司C", "公司D", "公司E"]
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
    if (!DASHSCOPE_API_KEY) throw new Error('DASHSCOPE_API_KEY 未配置');

    const { newCompany, existingCompanies, batchCheck } = await req.json();

    // 批量模式：从一组公司名里找重复组
    if (batchCheck && Array.isArray(batchCheck)) {
      if (batchCheck.length < 2) {
        return new Response(
          JSON.stringify({ success: true, data: { groups: [] } }),
          { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }
      const userText = `【公司名列表】\n${batchCheck.map((c, i) => `${i}. ${c}`).join('\n')}\n\n请找出指向同一家的公司组。`;

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
              { role: 'system', content: SYSTEM_PROMPT_BATCH },
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
    }

    // 单条模式：判断新公司 vs 已有公司
    if (!newCompany) throw new Error('缺少 newCompany 参数');
    if (!existingCompanies || !existingCompanies.length) {
      return new Response(
        JSON.stringify({ success: true, data: { duplicate: false, matchedIndex: -1, reason: '无已有记录，无需去重' } }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const userText = `【新公司名】\n${newCompany}\n\n【已有公司名列表】\n${existingCompanies.map((c, i) => `${i}. ${c}`).join('\n')}\n\n请判断新公司名是否与列表中某项是同一家。`;

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