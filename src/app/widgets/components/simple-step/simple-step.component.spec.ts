import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleStepComponent } from './simple-step.component';
describe(`${SimpleStepComponent.name}`, () => {
  let component: SimpleStepComponent;
  let fixture: ComponentFixture<SimpleStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimpleStepComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SimpleStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterAll(() => fixture.destroy());

  it('should create', (): void => {
    expect(component).toBeTruthy();
  });

  it('should contain a li html element for steps item', (): void => {
    const steps = fixture.nativeElement.querySelectorAll('li');
    expect(steps.length).toBe(component['steps'].length);
  });

  it('should contain only one li html element with class current-step', (): void => {
    component.countSteps = 3;
    component.currentStep = 1;
    fixture.detectChanges();

    const currentStep = fixture.nativeElement.querySelectorAll('.current-step');
    expect(currentStep.length).toBe(1);
  });

  it('should must be a class check-step for all steps with a number smaller than the current step', (): void => {
    component.countSteps = 5;
    component.currentStep = 3;
    fixture.detectChanges();

    const checkStep = fixture.nativeElement.querySelectorAll('.check-step');
    expect(checkStep.length).toBe(2);
  });
});
