import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatComponentV2 } from './components/chat/chat-v2.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChatComponentV2],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'ingage-ai-agent-ui';
}
