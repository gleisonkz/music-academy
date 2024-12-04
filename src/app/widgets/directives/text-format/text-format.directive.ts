import { AfterViewInit, Directive, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '[maTextFormat]',
  standalone: true,
})
export class TextFormatDirective implements AfterViewInit {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    this.formatText();
  }

  formatText() {
    const elementText: string = this.el.nativeElement.innerText;

    // Expressão regular para capturar texto entre símbolos (+, -, =)
    const regex = /([+-=@])([^+-=@]+)\1/g;

    const formattedText = elementText.replace(regex, (match, symbol, innerText) => {
      switch (symbol) {
        case '=':
          return `<span style="background-color: #3ef127";>${innerText.trim()}</span>`;
        case '-':
          return `<span style="background-color: #ff7300";>${innerText.trim()}</span>`;
        case '+':
          return `<span style="background-color: #f047ff";>${innerText.trim()}</span>`;
        case '@':
          return `<span style="background-color: #ff0000";>${innerText.trim()}</span>`;
        default:
          return innerText;
      }
    });

    this.renderer.setProperty(this.el.nativeElement, 'innerHTML', formattedText);
  }
}
