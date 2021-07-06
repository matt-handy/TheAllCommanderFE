import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpResponse, HttpParams } from '@angular/common/http';
import { interval, Observable, Subscription } from 'rxjs';
import { AppConfig } from '../app.config';


export interface CommandResponse {
  response: string;
  isCommand: boolean;
  hostname: string;
  username: string;
  protocol: string;
  pid: string;
}

export interface Session {
  hostname: string;
  username: string;
  protocol: string;
  sessionId: number;
}


@Component({
  selector: 'app-iowindow',
  templateUrl: './iowindow.component.html',
  styleUrls: ['./iowindow.component.css']
})
export class IowindowComponent implements OnInit {

  title = 'TheAllCommanderFE';
  subscription: Subscription;
  source = interval(1000);

  responses = [];
  sessions: Session[];
  currentSession: Session;

  newCommand: string;

  constructor(private http: HttpClient) {
    this.subscription = this.source.subscribe(val => this.printResponse());
    this.renderSessionOptions();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnInit() {
  }




  selectSession(sessionSelect: string) {
    const y: number = +sessionSelect;
    this.currentSession = this.sessions[y];
    this.responses = [];
  }

  processIncomingFile(base64File: string, uplinkedFilename: string) {
    const byteCharacters = atob(base64File);

    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);

    const saveData = (function() {
      const a = document.createElement('a');
      document.body.appendChild(a);
      // a.style = "display: none";
      return function(data, fileName) {
        const blob = new Blob([data], { type: 'octet/stream' });
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      };
    }());
    saveData(byteArray, uplinkedFilename);
  }

  getConfigResponse(): Observable<HttpResponse<CommandResponse>> {
    let params = new HttpParams();
    params = params.append('Hostname', this.currentSession.hostname);
    params = params.append('Username', this.currentSession.username);
    params = params.append('PID', '999');
    params = params.append('Protocol', this.currentSession.protocol);
    return this.http.get<CommandResponse>(AppConfig.settings.command_rest_url, { observe: 'response', params });
  }

  getSessions(): Observable<HttpResponse<Session[]>> {
    return this.http.get<Session[]>(AppConfig.settings.session_list_rest_url, { observe: 'response' });
  }

  renderSessionOptions() {
    this.getSessions().subscribe(data => {
      this.sessions = data.body;
    });
  }

  printResponse() {
    if (this.currentSession != undefined) {
      this.getConfigResponse().subscribe(data => {
        if (data.body.response === '<NO RESP>') {
          // Discard
        } else {
          if (data.body.response.startsWith('<control> uplinked')) {
            const elements = data.body.response.split(' ');
            this.processIncomingFile(elements[3], elements[2]);
          }
          this.responses.push(data.body);
        }
      });
    }
  }

  addCommand(command: CommandResponse): Observable<CommandResponse> {
    return this.http.post<CommandResponse>(AppConfig.settings.command_rest_url, command);
  }

  transmitCmd(command: string) {
    this.newCommand = '';
    this.addCommand({
      response: command, isCommand: true, hostname: this.currentSession.hostname,
      username: this.currentSession.username, pid: '9999', protocol: this.currentSession.protocol
    }).subscribe(response => {
      this.responses.push(response);
    });
  }

  handleUpload(event, filenameTxt: string) {
    if (filenameTxt === '') {
      alert('Must supply a filename to uplink file');
    } else {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        console.log(reader.result);
        const elements = reader.result.toString().split(',');
        console.log(elements[1]);
        const transmission = '<control> download ' + filenameTxt + ' ' + elements[1];
        this.transmitCmd(transmission);
      };
    }
  }
}
