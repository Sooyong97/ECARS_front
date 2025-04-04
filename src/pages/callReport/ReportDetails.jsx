import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { getReportById } from '../../apis/report';
import { toKoreaTime } from '../../utils/utils';

import './ReportContent.css';
import Header from '../../components/header/Header'; 
import KakaoMap from '../../components/call/KaKaoMap';

const ReportDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);

  const pauseRecording = () => {
  };

  const startSilenceTimer = () => {
  };

  useEffect(() => {
    getReportById(id).then((res) => {
      setReport(res);
    })
  }, [id]); // eslint-disable-next-line react-hooks/exhaustive-deps

  if (!report) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Header />
      <div className='Details'>
        <h1>{toKoreaTime(report.fields.date)}</h1>
        <div className='detail-contents'>
          <div className='detail-item'>
            <label>ID</label>
            <span>{report.pk}</span>
          </div>
          <div className='detail-item-row'>
            <div className='detail-item'>
              <label>주소</label>
              <span>{report.fields.address_name}</span>
            </div>
            <div className='detail-item'>
              <label>장소</label>
              <span>{report.fields.place_name}</span>
            </div>
          </div>
          <div className='detail-item-row'>
            <div className='detail-item'>
              <label>대분류</label>
              <span>{report.fields.category}</span>
            </div>
            <div className='detail-item'>
              <label>구급/비구급</label>
              <span>{report.fields.emergency_type}</span>
            </div>
          </div>
          <div className='detail-item'>
            <label>내용</label>
            <span>{report.fields.details}</span>
          </div>
          <div className='detail-item'>
            <label>녹취록</label>
            <span>{report.fields.full_text}</span>
          </div>
          <div className='detail-item'>
            <label>위치</label>
            <div style={{width: '700px', height: '300px'}}>
              <KakaoMap lat={report.fields.lat} lng={report.fields.lng} />
            </div>
          </div>
          <div className='detail-item'>
            <label>녹음 파일</label>
              {report.fields.audio_file &&
                <audio controls>
                  <source src={ `${process.env.REACT_APP_SERVER_URL}media/full_audio/${report.fields.audio_file.slice(17)}`} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              }
          </div>
        </div>
        <div className="list-button-container">
          <img 
            src="/images/list.png" 
            alt="목록" 
            className="toList-button" 
            onClick={() => navigate('/callreport')}  
          />
          <p>목록으로</p>
        </div>
      </div>
    </div>
  );
};

export default ReportDetails;
