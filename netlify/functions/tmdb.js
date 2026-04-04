exports.handler = async function(event, context) {
  // ดึง API Key จาก Environment Variable ของ Netlify (ปลอดภัย 100%)
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  
  // ---------------------------------------------------------
  // 🛡️ SECURITY & LOGGING SYSTEM (ระบบบันทึกประวัติการใช้งาน)
  // ---------------------------------------------------------
  // 1. ดึง IP Address ของผู้ใช้งาน
  const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'Unknown IP';
  // 2. ดึงข้อมูลเบราว์เซอร์และอุปกรณ์
  const userAgent = event.headers['user-agent'] || 'Unknown Device';
  // 3. ดูว่าเขาพยายามดึงข้อมูลส่วนไหน
  const { endpoint, ...queryParams } = event.queryStringParameters;
  // 4. เวลาปัจจุบัน
  const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

  // 📝 พิมพ์ Log ไว้ในเซิร์ฟเวอร์ (ดูได้เฉพาะเจ้าของเว็บใน Netlify Dashboard)
  console.log(`[${timestamp}] 🚦 IP: ${clientIp} | API Request: ${endpoint || 'NONE'} | Device: ${userAgent}`);

  // --- ระบบป้องกันเบื้องต้น (Rate Limiting/Blocking) สามารถใส่เพิ่มตรงนี้ได้ ---
  // ตัวอย่าง: ถ้ารู้ IP คนร้าย สามารถเขียนโค้ดบล็อกได้เลย เช่น
  // const blockedIPs = ['192.168.1.1', '10.0.0.5'];
  // if (blockedIPs.includes(clientIp)) {
  //   console.warn(`🚨 BLOCKED HACKER IP: ${clientIp}`);
  //   return { statusCode: 403, body: JSON.stringify({ error: 'Access Denied' }) };
  // }
  // ---------------------------------------------------------

  if (!endpoint) {
    console.warn(`[${timestamp}] ⚠️ WARNING: Missing endpoint from IP: ${clientIp}`);
    return { 
      statusCode: 400, 
      body: JSON.stringify({ error: 'Endpoint parameter is required' }) 
    };
  }

  // ประกอบ Query String ใหม่
  const params = new URLSearchParams(queryParams).toString();
  const url = `https://api.themoviedb.org/3${endpoint}?${params}`;

  try {
    // ยิงคำขอไปหา TMDB โดยแอบแนบ API Key ที่ฝั่งเซิร์ฟเวอร์
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TMDB_API_KEY}`,
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`[${timestamp}] ❌ TMDB API ERROR ${response.status} from IP: ${clientIp}`);
      throw new Error(`TMDB API Error: ${response.status}`);
    }

    const data = await response.json();

    // ส่งข้อมูลกลับไปให้หน้าเว็บ (Frontend) ของเรา
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // อนุญาตให้หน้าเว็บเรียกใช้ได้
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data from TMDB' })
    };
  }
};
