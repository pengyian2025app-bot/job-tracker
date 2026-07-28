// Supabase Edge Function: 读取飞书公开文档
// 接受飞书 URL，fetch HTML，提取正文，调用 Qwen 解读
// 部署：supabase functions deploy fetch-feishu --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DASHSCOPE_API_KEY = Deno.env.get('DASHSCOPE_API_KEY');
const QWEN_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

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

    const { feishuUrl } = await req.json();
    if (!feishuUrl) throw new Error('缺少 feishuUrl');

    // 1. 抓取飞书页面
    const resp = await fetch(feishuUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (JobTracker/1.0)' }
    });
    if (!resp.ok) throw new Error(`fetch 失败: ${resp.status}`);
    const html = await resp.text();

    // 2. 提取纯文本（用 Qwen 来"阅读"HTML 并提取）
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
            { role: 'system', content: '你是 HTML 解析助手，提取中文正文，保留原格式（用换行分段）。' },
            { role: 'user', content: `请提取这个飞书文档页面的纯中文正文（去除 HTML 标签、JS、CSS）：\n\n${html.slice(0, 50000)}` }
          ]
        },
        parameters: { result_format: 'message' }
      })
    });

    if (!qwenRes.ok) {
      const err = await qwenRes.text();
      throw new Error(`Qwen 提取失败: ${qwenRes.status} ${err.slice(0, 200)}`);
    }

    const qwenData = await qwenRes.json();
    const extractedText = qwenData?.output?.choices?.[0]?.message?.content;
    if (!extractedText) throw new Error('Qwen 提取失败');

    // 3. 基于提取的内容给面试建议
    const adviceRes = await fetch(QWEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: [
            { role: 'system', content: '你是求职教练，基于用户的面试复盘给出下次建议。' },
            { role: 'user', content: `以下是用户的面试复盘：\n\n${extractedText}\n\n请基于这份复盘，分析：\n1. 表现亮点（3 条）\n2. 待改进点（3 条）\n3. 下次面试准备建议（3 条）\n4. 推荐学习资源/方向` }
          ]
        },
        parameters: { result_format: 'message' }
      })
    });

    let advice = '';
    if (adviceRes.ok) {
      const adviceData = await adviceRes.json();
      advice = adviceData?.output?.choices?.[0]?.message?.content || '';
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          content: extractedText,
          advice: advice
        }
      }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
});