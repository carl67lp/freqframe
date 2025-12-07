import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QsoPane } from './qso-pane';

describe('QsoPane', () => {
  let component: QsoPane;
  let fixture: ComponentFixture<QsoPane>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QsoPane],
    }).compileComponents();

    fixture = TestBed.createComponent(QsoPane);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
