const axios = require("axios");

exports.caputere_payload = async (dt) => {
  dt.code = 200;
  dt.status = "success";
  dt.message = "Validasi payload berhasil";
  let no_wa = dt.req.params.no_wa || '';
  return dt;
}

exports.validasi_oayload_send_wa = async (dt) => {
  if (dt.payload.no_wa == '') {
    dt.message = 'no_wa must be numeric';
    dt.status = 'failed';
    dt.code = 400;
  }
  if (dt.payload.pesan == '') {
    dt.message = 'pesan must be numeric';
    dt.status = 'failed';
    dt.code = 400;
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
    //hit api woowa cek number
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
        {header: { 'Content-Type': 'application/json' }}
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


