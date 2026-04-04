exports.handler = async function(event, context) {
  // ดึง API Key จาก Environment Variable ของ Netlify (ปลอดภัย 100%)
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  
  // ดึงพารามิเตอร์ทั้งหมดที่ Frontend ส่งมาให้
  const { endpoint, ...queryParams } = event.queryStringParameters;

  if (!endpoint) {
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
