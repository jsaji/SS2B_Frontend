import React, { Component } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import ExaminerRegister from './Examiner/examiner_register.js';
import ExamineeLogin from './Examinee/login.js';
import ExamineeRegister from './Examinee/examinee_register.js';
import StudentFilter from './Examiner/student_filter.js';
import ManageExam from './Examiner/manage_exam.js';
import CreateExam from './Examiner/create_exam.js';
import EditExam from './Examiner/edit_exam.js';
import ExamRules from './Examinee/exam_rules.js';
import PersonalDeskCheck from './Examinee/personal_desk_check.js';
import ExamStartPage from './Examinee/exam_startpage.js';
import FaceUpload from './Examinee/user_image_upload.js';
import FaceAuth from './Examinee/user_image_auth.js';
import ExamPage from './Examinee/exam_page.js';
import ExaminerPortal from './Examiner/examiner_portal.js';
import ExamineeEndPage from './Examinee/exam_endpage.js';
import ExamWarning from './Examinee/exam_warnings.js';
import Redirect from './Examinee/redirect_page.js';
import VideoStreaming from './Examiner/video_streaming.js';

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <React.Fragment>
          <Route exact={true} path='/examiner/register' render={() => (
            <div className="App">
              <ExaminerRegister />
            </div>
          )} />
          <Route exact={true} path='/' render={() => (
            <div className="App">
              <ExamineeLogin />
            </div>
          )} />
          <Route exact={true} path='/examinee/register' render={() => (
            <div className="App">
              <ExamineeRegister />
            </div>
          )} />
          <Route exact={true} path='/examiner/' render={() => (
            <div className="App">
              <StudentFilter />
            </div>
          )} />
          <Route exact={true} path='/examiner/manage' render={() => (
            <div className="App">
              <ManageExam />
            </div>
          )} />
          <Route exact={true} path='/examiner/create' render={() => (
            <div className="App">
              <CreateExam />
            </div>
          )} />
          <Route exact={true} path='/examiner/edit' render={() => (
            <div className="App">
              <EditExam />
            </div>
          )} />
          <Route exact={true} path='/examinee/rules' render={() => (
            <div className="App">
              <ExamRules />
            </div>
          )} />
          <Route exact={true} path='/examinee/deskcheck' render={() => (
            <div className="App">
              <PersonalDeskCheck />
            </div>
          )} />
          <Route exact={true} path='/examinee/start' render={() => (
            <div className="App">
              <ExamStartPage />
            </div>
          )} />
          <Route exact={true} path='/examinee/exam/:roomId' render={() => (
            <div className="App">
              <ExamPage />
            </div>
          )} />
          <Route exact={true} path='/examinee/faceupload' render={() => (
            <div className="App">
              <FaceUpload />
            </div>
          )} />
          <Route exact={true} path='/examinee/faceauth' render={() => (
            <div className="App">
              <FaceAuth />
            </div>
          )} />
          <Route exact={true} path='/examiner/portal' render={() => (
            <div className="App">
              <ExaminerPortal />
            </div>
          )} />
          <Route exact={true} path='/examinee/endpage' render={() => (
            <div className="App">
              <ExamineeEndPage />
            </div>
          )} />
          <Route exact={true} path='/examinee/redirect' render={() => (
            <div className="App">
              <Redirect />
            </div>
          )} />
          <Route exact={true} path='/examinee/stream' render={() => (
            <div className="App">
              <VideoStreaming />
            </div>
          )} />
          <Route exact={true} path='/examinee/warning' render={() => (
            <div className="App">
              <ExamWarning />
            </div>
          )} />
        </React.Fragment>
      </BrowserRouter>
    );
  }
}

export default App;