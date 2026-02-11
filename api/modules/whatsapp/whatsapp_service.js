const axios = require("axios");

exports.capture_payload = async (dt) => {
  dt.code = 200;
  dt.status = "success";
  dt.message = "Validasi payload berhasil";
  let no_wa = dt.req.params.no_wa || '';
  return dt;
}

exports.capture_payload_send_wa = async (dt) => {
  dt.code = 200;
  dt.status = "success";
  dt.message = "Validasi payload berhasil";
  return dt;
}

exports.validasi_payload_send_wa = async (dt) => {
  if (!dt.payload.no_wa || dt.payload.no_wa == '') {
    dt.message = 'no_wa wajib diisi';
    dt.status = 'failed';
    dt.code = 400;
    return dt;
  }
  
  if (!dt.payload.pesan || dt.payload.pesan == '') {
    dt.message = 'pesan wajib diisi';
    dt.status = 'failed';
    dt.code = 400;
    return dt;
  }
  
  return dt;
}

exports.validasi_payload_cek_validasi = async (dt) => {
  if (dt.no_wa == ''){
    dt.message = 'no_wa must be numeric';
    dt.status = 'failed';
    dt.code = 400;
  }

  if (dt.status !== 'failed' && !/^\d+$/.test(dt.no_wa)){
    dt.message = 'no_wa must be numeric';
    dt.status = 'failed';
    dt.code = 400;
  }
  return dt;
}

exports.hit_api_woowa_check_number = async (dt) => {
  try{
    const baseURL = 'https://notifapi.com';
    const apikey = 'f538a366609b3a97ce751087dbc08e961b2ce1dcfe7ac4fb';

    const payload = {
      phone_no: parseInt(dt.no_wa),
      key: apikey,
    };
    console.log(payload);

    const response = await axios.post(
      `${baseURL}/check_number`,
      payload,
      {headers: { 'Content-Type': 'application/json' }}
    );

    return{
      code: 200,
      status: "success",
      message: "Number phone valid",
      data: response.data
    }
  } catch (error) {
    return {
      code: 500,
      status: "error",
      message: "Invalid number phone",
      data: error
    };
  }
}

exports.hit_api_woowa_send_wa = async (dt) => {
  if (dt.status === "failed") return dt;

  try {
        const baseUrl = process.env.WOOWA_ENDPOINT;
        const apiKey = process.env.WOOWA_KEY;

        const payload = {
            phone_no: dt.payload.no_wa,
            key: apiKey,
            message: dt.payload.pesan,
        };

        console.log('payload : ', payload);

        const response = await axios.post(
            `${baseUrl}/send_message`,
            payload,
            { headers: { 'Content-Type': 'application/json' } }
        );

        console.log('Sukses:', response.data);
        dt.message = response?.data?.results?.message;

    } catch (error) {
        dt.message = 'invalid';
        dt.status = 'failed';
        dt.code = 400;
        console.error('Gagal:', error.response?.data || error.message);
    }
}