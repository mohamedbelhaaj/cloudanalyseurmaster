import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AwsConfigurationComponent } from './aws-configuration.component';

describe('AwsConfigurationComponent', () => {
  let component: AwsConfigurationComponent;
  let fixture: ComponentFixture<AwsConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AwsConfigurationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AwsConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
