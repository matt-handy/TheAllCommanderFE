import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IowindowComponent } from './iowindow.component';

describe('IowindowComponent', () => {
  let component: IowindowComponent;
  let fixture: ComponentFixture<IowindowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IowindowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IowindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
