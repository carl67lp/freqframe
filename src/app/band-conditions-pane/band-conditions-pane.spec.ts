import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BandConditionsPane } from './band-conditions-pane';

describe('BandConditionsPane', () => {
  let component: BandConditionsPane;
  let fixture: ComponentFixture<BandConditionsPane>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BandConditionsPane]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BandConditionsPane);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
