import { TestBed } from '@angular/core/testing';
import { NoteEarTrainingPage } from './note-ear-training.page';

describe('AppComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [NoteEarTrainingPage],
    })
  );

  it('should create the app', () => {
    const fixture = TestBed.createComponent(NoteEarTrainingPage);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
