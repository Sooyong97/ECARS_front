import axios from 'axios';
import { getCookie } from '../utils/cookie';
import { errorWithoutBtn, successWithoutBtn } from '../utils/swal';

const csrftoken = getCookie('csrftoken');
const SERVER_URL = process.env.REACT_APP_SERVER_URL

// 로그인
export const login = (id, password) => {
  axios.post(SERVER_URL + 'api/auth/signin/', { id, password }, {
    headers: {
      'X-CSRFToken': csrftoken
    }
  })
  .then((res) => {
    const token = res.data.token;
    const message = res.data.message;
    if (message === 'SUCCESS') {
      localStorage.setItem('access', token);
      window.location.href = '/main';
    }
  })
  .catch((error) => {
    const msg = error.response?.data?.message;
    if (msg === 'INVALID_CREDENTIALS') {
      errorWithoutBtn('아이디 또는 비밀번호가 일치하지 않습니다.');
    } else {
      errorWithoutBtn('로그인 중 알 수 없는 오류가 발생했습니다.');
    }
    console.error('로그인 오류:', error);
  });
};

// 아이디 중복 확인
export const idCheck = (id) => {
  return axios.post(SERVER_URL + 'api/accounts/idcheck/', {id}, {
    headers: {
      'X-CSRFToken': csrftoken
    }
  })
  .then((res) => {return res.data.valid ? true : false})
  .catch((error) => console.log(error))
}

// 이메일 중복 확인
export const emailCheck = (email) => {
  const csrftoken = getCookie('csrftoken');

  return axios.post(SERVER_URL + 'api/accounts/emailcheck/', {email}, {
    headers: {
      'X-CSRFToken': csrftoken
    }
  })
  .then((res) => {return res.data.valid ? true : false})
  .catch((error) => {
    console.log(error);
    errorWithoutBtn('알 수 없는 오류가 발생했습니다.', '잠시후 다시 시도해주세요.');
  })
}

// 인증코드 발송
export const sendCode = (email) => {
  return axios.post(SERVER_URL + 'api/auth/send-email/', {email}, {
    headers: {
      'X-CSRFToken': csrftoken
    }
  })
  .then(() => {
    successWithoutBtn('인증번호가 발송되었습니다.', '5분 안에 인증번호를 입력해주세요.', () => {});
    return true;
  })
  .catch((error) => {
    console.log(error);
    errorWithoutBtn('이메일 발송에 실패하였습니다.', '잠시후 다시 시도해주세요.');
  })
}

// 인증코드 확인
export const checkCode = (email, code) => {
  return axios.post(SERVER_URL + 'api/auth/verify-code/', {email, code}, {
    headers: {
      'X-CSRFToken': csrftoken
    }
  })
  .then((res) => {
    const msg = res.data.message;
    
    if (msg == 'SUCCESS') return true;
  })
  .catch((error) => {
    const msg = error.response.data.message
    
    if (msg == 'INVALID_CODE') errorWithoutBtn('인증번호가 정확하지 않습니다.');
    console.log(error);
  })
}

// 회원가입
export const signup = (id, name, email, password) => {
  return axios.post(SERVER_URL + 'api/accounts/signup/', { name, id, password, email }, {
    headers: {
      'X-CSRFToken': csrftoken
    }
  })
  .then((res) => {
    const msg = res.data.message;
    if (msg) return true;
  })
  .catch((error) => {
    const code = error.response.data.errorCode;
    if (code == 0) errorWithoutBtn('비밀번호는 8글자 이상이어야 합니다.', '대문자, 숫자, 특수기호를 최소 1개 이상 포함해주세요.');
    else if (code == 1) errorWithoutBtn('이미 가입된 이메일입니다.');

    console.error('회원가입:', error);
  })
}

// 유저 정보 가져오기
export const getUser = async () => {
  const access = localStorage.getItem('access');

  try {
    const res = await axios.post(SERVER_URL + 'api/accounts/userJWT/', {}, {
      headers: {
        Authorization: `Bearer ${access}`
      }
    })
    return res.data
  } catch (error) {
    console.log(error);
  }
}

// 로그아웃
export const logout = () => {
  localStorage.removeItem('access');
  window.location.href = '/';
}

// 아이디 찾기 : 이메일 인증코드 발송
export const findid = (email) => {
  return axios.post(SERVER_URL + 'api/accounts/findid/', { email }, {
    headers: {
      'X-CSRFToken': csrftoken
    }
  })
  .then((res) => {
    return res.data.message === 'EMAIL_SENT';
  })
  .catch((error) => {
    const status = error.response.status;
    if (status == 404) errorWithoutBtn('해당 이메일로 가입된 정보가 없습니다.');
    console.error('아이디 찾기:', error);
  })
}

// 아이디 찾기 : 인증코드 확인
export const verifyid = (email, code) => {
  return axios.post(SERVER_URL + 'api/accounts/verifyid/', { email, code }, {
    headers: {
      'X-CSRFToken': csrftoken
    }
  })
  .then((res) => {
    return res.data.id;
  })
  .catch((error) => {
    const msg = error.response.data.message;
    if (msg == 'INVALID_CODE') errorWithoutBtn('인증번호가 정확하지 않습니다.');
    console.log(error);
  })
}

// 비밀번호 변경 : 인증코드 발송
export const changepw = (id, email) => {
  return axios.post(SERVER_URL + 'api/accounts/indpw/', { id, email }, {
    headers: {
      'X-CSRFToken': csrftoken
    }
  })
  .then((res) => {return res.data.valid ? true : false})
  .catch((error) => {
    const status = error.response.status;
    if (status == 404) errorWithoutBtn('아이디나 이메일 정보가 정확하지 않습니다.');
    console.error('비밀번호 변경:', error);
  })
}

// 비밀번호 변경 : 인증코드 확인
export const verifypw = (id, email, code) => {
  return axios.post(SERVER_URL + 'api/accounts/verifypw/', { id, email, code }, {
    headers: {
      'X-CSRFToken': csrftoken
    }
  })
  .then((res) => {return res.data.message == 'SUCCESS' ? true : false})
  .catch((error) => {
    const msg = error.response.data.message;
    if (msg == 'INVALID_CODE') errorWithoutBtn('인증번호가 정확하지 않습니다.');
    console.log(error);
  })
}

// 비밀번호 변경 요청
export const resetPassword = (id, newPassword) => {
  return axios.post(SERVER_URL + 'api/accounts/changepw/', { id, newPassword }, {
    headers: {
      'X-CSRFToken': csrftoken
    }
  })
  .then((res) => {
    return res.data.message === 'PASSWORD_UPDATED';
  })
  .catch((error) => {
    const msg = error.response?.data?.message;
    if (msg === 'INVALID_PASSWORD') {
      errorWithoutBtn('비밀번호는 최소 8자 이상, 대/소문자, 숫자, 특수문자를 포함해야 합니다.');
    } else {
      errorWithoutBtn('비밀번호 변경 중 오류가 발생했습니다.');
    }
    console.error('resetPassword:', error);
  })
}