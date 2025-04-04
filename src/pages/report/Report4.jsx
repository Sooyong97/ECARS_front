import React, { useEffect, useState, useCallback, useRef } from 'react';
// Removed import { useNavigate } from 'react-router-dom'; since it's unused

import { ReactMic } from 'react-mic';
import { convertToWav } from '../../utils/report';

import './Report.css';
import Overlay from '../../components/call/Overlay';
import CallModal from '../../components/call/CallModal';
import { GoBackBtn } from '../../components/CommonStyles';
import { getReportById } from '../../apis/report';

const Report4 = () => {
  const socket = useRef(null);
  const isSending = useRef(false);
  const [start, setStart] = useState(false);
  const [recording, setRecording] = useState(false);
  const [chat, setChat] = useState([{ text: '녹음 버튼을 누르고 신고를 시작해주세요.', isUser: false }]);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [done, setDone] = useState(false);
  const [address, setAddress] = useState('');
  const [place, setPlace] = useState('')
  const [time, setTime] = useState('')
  const [content, setContent] = useState('');
  const [where, setWhere] = useState('');
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);

  const chunksRef = useRef([]);
  const allChunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);

  // 녹음 중지
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      recognitionRef.current.stop();
      setRecording(false);
      clearTimeout(silenceTimerRef.current);
    }
  }, []);

  const startSilenceTimer = useCallback(() => {
    silenceTimerRef.current = setTimeout(async () => {
      pauseRecording();
    }, 3000);
  }, [pauseRecording]);

  // 녹음 시작
  const startRecording = useCallback(() => {
    setStart(true);

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        chunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = e => {
          chunksRef.current.push(e.data);
          allChunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          setIsProcessing(true); // 처리 중 상태 설정
          await processChunks();
        };

        mediaRecorderRef.current.start();
        recognitionRef.current.start();
        setRecording(true);
        startSilenceTimer();
      })
      .catch(err => {
        console.error('Error accessing microphone:', err);
      });
  }, [startSilenceTimer]);

  // tts
  const playTts = useCallback((text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    window.speechSynthesis.speak(utterance);

    utterance.onend = () => {
      startRecording();
    };
  }, [startRecording]);

  const resetSilenceTimer = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    startSilenceTimer();
  }, [startSilenceTimer]);

  // 백 -> 프론트 소켓
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const token = localStorage.getItem('access');
    socket.current = new WebSocket(`ws://localhost:8080/ecars/ws/audio?token=${token}`);

    socket.current.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received:', data);
      setIsProcessing(false);

      if (data.log_id) {
        getReportById(data.log_id).then((res) => {
          setAddress(res.fields.address_name);
          setPlace(res.fields.place_name);
          setTime(res.fields.date);
          setContent(res.fields.details);
          setWhere(res.fields.jurisdiction);
          setLat(res.fields.lat);
          setLng(res.fields.lng);
        });
        setDone(true);
        processChunks(true, data.log_id);
      }

      if (data.message) {
        setChat(prevChat => [...prevChat, { text: data.message, isUser: false }]);
        playTts(data.message);
      }
    };

    socket.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.current.onclose = () => {
      console.log('WebSocket closed');
    };

    return () => {
      if (socket.current) socket.current.close();
    };
  }, [playTts]);

  const processChunks = async (isFinal = false, id = 0) => {
    if (isSending.current) return;
    isSending.current = true;

    if (isFinal) {
      const allBlob = new Blob(allChunksRef.current, { 'type': 'audio/webm' });
      const allArrayBuffer = await allBlob.arrayBuffer();
      const allAudioData = new Uint8Array(allArrayBuffer);
      const allWavBuffer = await convertToWav(allAudioData);
      socket.current.send(allWavBuffer);
      allChunksRef.current = [];
    } else {
      const blob = new Blob(chunksRef.current, { 'type': 'audio/webm' });
      const arrayBuffer = await blob.arrayBuffer();
      const audioData = new Uint8Array(arrayBuffer);
      const wavBuffer = await convertToWav(audioData);
      socket.current.send(wavBuffer);
      chunksRef.current = [];
    }

    setTimeout(() => {
      isSending.current = false;
    }, 3000); // 3초 후 다시 전송 허용
  };

  // stt
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Web Speech API is not supported by this browser.');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'ko-KR';

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      setInterimTranscript(interimTranscript); // 실시간으로 인식된 텍스트 업데이트

      if (finalTranscript) {
        setChat(prevChat => [...prevChat, { text: finalTranscript, isUser: true }]);
        setInterimTranscript(''); // 최종 텍스트가 인식되면 interim 텍스트 초기화
      }

      resetSilenceTimer();
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech Recognition Error', event.error);
    };
  }, [resetSilenceTimer]);

  return (
    <div className="report-container">
      {done && <>
        <Overlay />
        <CallModal address={address} place={place} time={time} content={content} where={where} lat={lat} lng={lng} />
      </>}
      <GoBackBtn />
      <div className="recording-container">
        <div className="bold-text">정확한 접수를 위해 녹음버튼을 눌러주세요</div>
        <div className="react-mic-container">
          <ReactMic
            record={recording}
            className="sound-wave"
            mimeType="audio/wav"
            strokeColor="#444445"
            backgroundColor="#ffffff" />
        </div>
        <div className="button-container">
          {!start ? 
            <button className="btn-border" onClick={startRecording} disabled={recording}>
              <div className="circle" />
            </button> :
            <button className="btn-border" onClick={pauseRecording} disabled={!recording}>
              <div className="square" />
            </button>
          }
        </div>
      </div>
      <div className="chat-container">
        {chat.map((msg, index) => (
          <div key={index} className={`chat-bubble ${msg.isUser ? 'user' : 'system'}`}>
            {msg.text}
            {isProcessing && msg.isUser && index === chat.length - 1 && (
              <div className="processing-text">처리 중입니다. 잠시만 기다려주세요.</div>
            )}
          </div>
        ))}
        {interimTranscript && (
          <div className="chat-bubble user">
            {interimTranscript}
          </div>
        )}
      </div>
    </div>
  );
}

export default Report4;
