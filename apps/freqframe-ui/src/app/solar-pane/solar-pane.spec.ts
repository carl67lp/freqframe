import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolarPane } from './solar-pane';

describe('SolarPane', () => {
  let component: SolarPane;
  let fixture: ComponentFixture<SolarPane>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolarPane],
    }).compileComponents();

    fixture = TestBed.createComponent(SolarPane);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
