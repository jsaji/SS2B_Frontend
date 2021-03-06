import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../images/logo_white.png";
import CountDownTimer from "./timer.js";
import styled from "styled-components";
import VideoCall from "./scripts/video_call.js";
import { Button, Alert } from "react-bootstrap";
import { getDisplayStream } from "./scripts/MediaAccess";
import io from "socket.io-client";
import "./exampage.css";
import PDFview from "./pdf_viewer"
import ExamWarnings from './exam_warnings.js';
import { getExamRecording, editExamRecording } from '../api_caller.js'
import { getTimeRemaining, datetimeformat, formatDate, formatDateToLocal, formatDateToLocalString, getLatestEndTime } from '../functions.js';

import {
  ShareScreenIcon,
  MicOnIcon,
  MicOffIcon,
  CamOnIcon,
  CamOffIcon,
} from "./scripts/Icons";

const Header = styled.header`
  background-color: #2196f3;
  color: white;
  padding: 1%;
  margin-bottom: 3%;
`;

class ExamPage extends React.Component {
  constructor() {
    super();

    const is_examiner = parseInt(localStorage.getItem("is_examiner"));
    const user_id = localStorage.getItem("user_id");
    const exam_id = localStorage.getItem("exam_id");
    const time_left = localStorage.getItem("time_left");
    const duration = localStorage.getItem("duration");
    const exam_name = localStorage.getItem("exam_name");
    const student_name = localStorage.getItem("student_name");
    const time_started = localStorage.getItem("time_started");
    const exam_recording_id = localStorage.getItem("exam_recording_id");
    const document_link = localStorage.getItem("document_link");

    this.state = {
      localStream: {},
      remoteStreamUrl: "",
      streamUrl: "",
      initiator: false,
      peer: {},
      full: false,
      connecting: false,
      waiting: true,
      micState: true,
      camState: true,
      isActive: false,
      user_id: user_id,
      exam_id: exam_id,
      exam_name: exam_name,
      time_started: time_started,
      exam_recording_id: exam_recording_id,
      is_examiner: Boolean(is_examiner),
      student_name: student_name,
      video: "",
      duration: duration,
      time_left: time_left,
      duration_warning: "",
      stream_visible: true,
      document_link: document_link
    };
  }
  videoCall = new VideoCall();

  async componentDidMount() {
    let exams_in_progress_data = null;
    let params = { "exam_recording_id": this.state.exam_recording_id }
    if (!this.state.is_examiner) {
      params["in_progress"] = 1;
      params["user_id"] = this.state.user_id;
    }
    exams_in_progress_data = await getExamRecording(params);

    if (exams_in_progress_data.exam_recordings.length === 0 && !this.state.is_examiner) window.location.href = '/examinee/redirect';
    else if (exams_in_progress_data.exam_recordings !== 0) {
      let er = exams_in_progress_data.exam_recordings[0]
      this.setState({
        exam_id: er.exam_id,
        exam_name: er.exam_name,
        time_started: formatDateToLocal(er.time_started),
        exam_recording_id: er.exam_recording_id,
        time_left: getTimeRemaining(er.time_started, er.duration),
        document_link: er.document_link,
        duration: er.duration,
        time_ended: formatDateToLocal(er.time_ended)
      });
    }
    const socket = io('http://localhost:8080');
    const component = this;
    this.setState({ socket });
    const { roomId } = this.props.match.params;
    //console.log(this.props.match.params)

    this.getUserMedia().then(() => {
      socket.emit("join", { roomId: roomId });
    });

    socket.on("init", () => {
      component.setState({ initiator: true });
    });
    socket.on("ready", () => {
      component.enter(roomId);
    });
    socket.on("desc", (data) => {
      if (data.type === "offer" && component.state.initiator) return;
      if (data.type === "answer" && !component.state.initiator) return;
      component.call(data);
    });
    socket.on("disconnected", () => {
      component.setState({ initiator: true });
    });
    socket.on("full", () => {
      component.setState({ full: true });
    });
  }

  setAudioLocal() {
    if (this.state.localStream.getAudioTracks().length > 0) {
      this.state.localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    this.setState({
      micState: !this.state.micState
    })
  }

  setVideoLocal() {
    if (this.state.localStream.getVideoTracks().length > 0) {
      this.state.localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    this.setState({
      camState: !this.state.camState
    })
  }

  getUserMedia(cb) {
    return new Promise((resolve, reject) => {
      navigator.getUserMedia = navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia;
      const op = {
        video: {
          width: { min: 160, ideal: 640, max: 1280 },
          height: { min: 120, ideal: 360, max: 720 },
        },
        audio: true,
      };
      navigator.getUserMedia(
        op,
        (stream) => {
          this.setState({ streamUrl: stream, localStream: stream });
          this.localVideo.srcObject = stream;
          resolve();
        },
        () => { }
      );
    });
  }
  getDisplay() {
    getDisplayStream().then((stream) => {
      stream.oninactive = () => {
        this.state.peer.removeStream(this.state.localStream);
        this.getUserMedia().then(() => {
          this.state.peer.addStream(this.state.localStream);
        });
      };
      this.setState({ streamUrl: stream, localStream: stream });
      this.localVideo.srcObject = stream;
      this.state.peer.addStream(stream);
    });
  }

  enter = roomId => {
    this.setState({ connecting: true });
    const peer = this.videoCall.init(
      this.state.localStream,
      this.state.initiator
    );

    // console.log("hfytuhj")
    this.setState({ peer });

    peer.on('signal', data => {
      const signal = {
        room: roomId,
        desc: data
      };
      this.state.socket.emit('signal', signal);
    });
    peer.on('stream', stream => {
      if (this.state.is_examiner) {
        this.remoteVideo.srcObject = stream;
        this.localVideo.setAttribute("display", "none");
      }
      this.setState({ connecting: false, waiting: false });
    });
    peer.on('error', function (err) {
      console.log(err);
    });
    if (this.state.is_examiner && this.remoteVideo.srcObject === null) {
      this.setState({ stream_visible: false });
    }
  };

  call = otherId => {
    this.videoCall.connect(otherId);
  };
  renderFull = () => {
    if (this.state.full) {
      return 'The room is full';
    }
  };


  handleDurationWarning = (value) => {
    this.setState({ duration_warning: value });
  }

  endExam = async () => {
    let response = await editExamRecording(this.state.exam_recording_id, "end", this.state.user_id);
    if (response === null) {
      alert('Something went wrong while trying to end the exam.')
      return;
    }
    window.location.href = '/examinee/endpage'
  }

  render() {
    return (
      <div className="App">
        <Header>
          <div class="d-flex" style={{ marginLeft: "auto", marginRight: "auto", width: "70%" }}>
            <div class="align-self-center">
              <img
                src={logo}
                className="move"
                alt="logo"
                style={{ height: "50px", marginBottom: "4%" }}
              ></img>
            </div>
            <div class="align-self-center" style={{ marginLeft: "10px" }}>
              <h3>Examination Page</h3>
            </div>
            <div class="ml-auto align-self-center">
              <div class="end-exam-btn">
                {!this.state.is_examiner &&
                  <button class="btn btn-light" onClick={this.endExam}>
                    End Exam
                  </button>
                }
                {this.state.is_examiner &&
                  <a href='/examiner'>
                    <button class="btn btn-light" >
                      Return to Exam Attempts
                    </button>
                  </a>

                }

              </div>
            </div>
          </div>
        </Header>

        <div class="container-fluid" style={{ marginLeft: "auto", marginRight: "auto", width: "80%" }}>
          <div class="row">
            <div class="col-sm">
              <video width="350"
                autoPlay
                id="localVideo"
                muted
                style={{ display: this.state.is_examiner ? 'none' : 'inline' }}
                ref={(video) => (this.localVideo = video)}
              />
              <h6 style={{ visibility: this.state.stream_visible && this.state.is_examiner ? 'visible' : 'hidden' }}>Video stream has not started</h6>

              <section class="experiment">
                {!this.state.is_examiner ? (
                  <div>
                    <div className="controls" style={{ marginTop: "-10px", marginBottom: "20px" }}>
                      <button
                        className="control-btn"
                        onClick={() => {
                          this.getDisplay();
                        }}
                      >
                        <ShareScreenIcon />
                      </button>

                      <button
                        className="control-btn"
                        onClick={() => {
                          this.setAudioLocal();
                        }}
                      >
                        {this.state.micState ? <MicOnIcon /> : <MicOffIcon />}
                      </button>

                      <button
                        className="control-btn"
                        onClick={() => {
                          this.setVideoLocal();
                        }}
                      >
                        {this.state.camState ? <CamOnIcon /> : <CamOffIcon />}

                      </button>
                    </div>
                    <div id="createBroadcast">
                      <section>
                        <h5 type="text" id="user_id" style={{ marginBottom: "20px" }} disabled>
                          <b>Student ID:</b> {this.state.user_id}
                        </h5>
                        <CountDownTimer duration={this.state.time_left} duration_warning={this.handleDurationWarning} />
                        {this.state.duration_warning ? <Alert variant='danger' style={{ width: "30%", marginRight: 'auto', marginLeft: 'auto' }}>{this.state.duration_warning}</Alert> : ""}
                        <br></br>
                      </section>
                    </div>
                  </div>
                ) : (
                    <div id="listStudents">
                      <video
                        autoPlay
                        id='remoteVideo'
                        muted
                        ref={video => (this.remoteVideo = video)}
                      />
                      <table style={{ width: "100%" }} id="rooms-list"></table>
                      <h6><b>Student ID:</b> {this.state.user_id}</h6>
                      <h6><b>Student Name:</b> {this.state.student_name}</h6>
                      <h6><b>Exam Name:</b> {this.state.exam_name}</h6>
                      <h6><b>Duration:</b> {this.state.duration}</h6>
                      <h6><b>Time Started:</b> {this.state.time_started}</h6>
                      {this.state.is_examiner && this.state.time_ended !== "1970-01-01 21:00:00" &&
                        <h6><b>Time Ended:</b> {this.state.time_ended}</h6>
                      }
                    </div>
                  )}
              </section>
              <ExamWarnings data={this.state} />
            </div>
            {!this.state.is_examiner &&
              <div class="col-md">
                <PDFview document={this.state.document_link} />
              </div>
            }

          </div>
        </div>
      </div>
    );
  }
}
export default withRouter(ExamPage);