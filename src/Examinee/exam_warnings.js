import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Form, Button, Alert } from 'react-bootstrap';
import styled from 'styled-components';
import { BrowserRouter } from "react-router-dom";
import { getExamWarning, createExamWarning, deleteExamWarning } from '../api_caller';
import { formatDateToLocal } from '../functions.js';
import DateTime from 'react-datetime';
import "react-datetime/css/react-datetime.css";
import { getLatestEndTime, datetimeformat } from '../functions.js';
import moment from 'moment';

const Title = styled.div`
    padding:14px 5px 14px 0px;
  `;

const Text = styled.span`
  vertical-align: text-top;
  `;

export default class ExamWarnings extends Component {

    constructor(props) {
        super(props);

        // Required props
        // <ExamWarnings data={{is_examiner:1, exam_recording_id: 617, time_started: '2020-10-14 05:30:00', duration: '03:00:00'}}/>
        // time_ended can be included or not - include if exam attempt has already been done, if in progress, leave out
        // component can be used for examinee or examiner
        this.getExamWarnings = this.getExamWarnings.bind(this);
        this.toggleCreate = this.toggleCreate.bind(this);
        this.deleteSingleExamWarning = this.deleteSingleExamWarning.bind(this);
        this.createSingleWarning = this.createSingleWarning.bind(this);
        this.onChangeNewDescription = this.onChangeNewDescription.bind(this);
        this.onChangeNewWarningTime = this.onChangeNewWarningTime.bind(this);
        this.setExamWarnings = this.setExamWarnings.bind(this);

        let time_started_string = this.props.data.time_started;
        let time_started = moment.utc(time_started_string, datetimeformat).toDate()
        let duration = this.props.data.duration;
        let latest_time_ended = this.props.data.time_ended;
        if (latest_time_ended === null || !latest_time_ended) latest_time_ended = getLatestEndTime(time_started_string, duration);

        this.state = {
            exam_recording_id: props.data.exam_recording_id,
            exam_warnings: [],
            is_examiner: props.data.is_examiner,
            time_started: time_started,
            latest_time_ended: latest_time_ended,
            create_new: false,
            new_description: '',
            new_warning_time: time_started
        }
    }

    componentDidMount = async () => {
        // change to 30000
        await this.getExamWarnings();
        this.interval = setInterval(async () => {
            await this.getExamWarnings();
        }, 10000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    getExamWarnings = async () => {
        let exam_warning_data = await getExamWarning({ 'exam_recording_id': this.state.exam_recording_id });
        console.log("all warnings:",exam_warning_data);
        if (exam_warning_data !== null && exam_warning_data.exam_warnings.length > 0) {
            await this.setExamWarnings(exam_warning_data.exam_warnings);
        }
    }

    setExamWarnings = async(warnings) => {
        this.setState({
            exam_warnings: warnings
        });
    }

    deleteSingleExamWarning = async (exam_warning_id) => {
        let success = deleteExamWarning(exam_warning_id);
        if (!success) {
            alert('The exam warning could not be deleted. Please try again.');
            return;
        }
        setTimeout(async () => {
            await this.getExamWarnings();
        }, 250);
    }

    createSingleWarning = async () => {
        if (!this.isValidDateTime(moment(this.state.new_warning_time))) {
            alert("The warning time is required to be between exam time started and exam time ended (or current time).");
            return;
        }

        if (this.state.new_warning_time === null || this.state.new_description === '' || this.state.new_description === null) {
            alert("Please enter a valid warning time and warning description.");
            return;
        }

        var warning_time = moment.utc(this.state.new_warning_time).format(datetimeformat);
        var new_warning = createExamWarning(this.state.exam_recording_id, warning_time, this.state.new_description)
        if (new_warning === null) alert('Something went wrong!');
        else {
            setTimeout(async () => {
                await this.getExamWarnings();
            }, 250);
            this.toggleCreate();
        }
    }

    toggleCreate = () => {
        this.setState({
            create_new: !this.state.create_new,
            new_description: ''
        });
    }

    onChangeNewDescription = async(e) => {
        e.preventDefault();
        this.setState({
            new_description: e.target.value
        });
    }

    onChangeNewWarningTime = (datetime) => {
        this.setState({
            new_warning_time: datetime._d
        });
    }

    isValidDateTime = (current) => {
        return current.isAfter(moment(this.state.time_started).subtract(1, 'minute'))
            && current.isBefore(moment(this.state.latest_time_ended).add(1, 'minute'))
    }

    valid = (current) => {
        return current.isAfter(moment().subtract(2, 'day')) && current.isBefore(moment().add(2, 'day'))
    }

    render() {
        return (
            <div style={{width: '30%', marginLeft: 'auto', marginRight: 'auto'}}>
                {this.state.is_examiner &&
                    <div class="my-3">
                        <button type="button" hidden={this.state.create_new} onClick={this.toggleCreate} class="btn btn-lg btn-block btn-danger">Give Warning</button>
                        {this.state.create_new &&
                            <div class="container">
                                <div class="row my-2">
                                    <div class="col">
                                        <DateTime isValidDate={this.valid} initialValue={this.state.time_started} onChange={this.onChangeNewWarningTime} value={this.state.new_warning_time} />
                                    </div>
                                    <div class="col-9">
                                        <input onChange={this.onChangeNewDescription} placeholder="Enter warning description here." value={this.state.new_description} ></input>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col">
                                        <button class="btn btn-lg btn-block btn-danger" onClick={this.createSingleWarning}>Save</button>
                                        <button class="btn btn-lg btn-block btn-secondary" onClick={this.toggleCreate}>Cancel</button>
                                    </div>
                                </div>
                            </div>

                        }
                    </div>
                }
                {this.state.exam_warnings.map((warning) =>
                    <Alert key={warning.exam_warning_id} variant="danger">
                        {!this.state.is_examiner &&
                            <p>{formatDateToLocal(warning.warning_time)}: {warning.description}</p>
                        }
                        {this.state.is_examiner &&
                            <div class="container">
                                <div class="row">
                                    <div class="col-10">
                                        <p>{formatDateToLocal(warning.warning_time)}: {warning.description}</p>
                                    </div>
                                    <div class="col">
                                        <button type="button" class="btn btn-lg btn-danger" onClick={() => this.deleteSingleExamWarning(warning.exam_warning_id)} >Delete</button>
                                    </div>
                                </div>
                            </div>
                        }
                    </Alert>
                )}


            </div>
        );
    }
}
