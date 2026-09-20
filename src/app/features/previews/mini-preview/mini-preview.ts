import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DemoKind } from '../../../core/models/project.model';

@Component({
  selector: 'app-mini-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="frame">
      @switch (kind()) {

        @case ('transferorders') {
          <div class="mk military">
            <div class="row between">
              <div class="row gap-sm"><span class="dot amber"></span><b>TRANSFER ORDER — 2024/114</b></div>
              <span class="badge amber">#A-1029</span>
            </div>
            <div class="grid-2">
              <div class="field"><span>From Unit</span><b>Battalion 3</b></div>
              <div class="field"><span>To Unit</span><b>Battalion 7</b></div>
              <div class="field"><span>Soldier ID</span><b>M-88102</b></div>
              <div class="field"><span>Status</span><b class="ok">APPROVED</b></div>
            </div>
            <div class="doc">
              <div class="bar w-90"></div><div class="bar w-75"></div><div class="bar w-60"></div>
            </div>
            <div class="row end gap-sm">
              <button class="btn">🖨️ Print</button>
              <button class="btn primary">✅ Execute</button>
            </div>
          </div>
        }

        @case ('reminder') {
          <div class="mk mobile">
            <div class="row between subtle"><span>9:41</span><span>📶 🔋</span></div>
            <div class="app-title">🔔 Reminder</div>
            <div class="list">
              <div class="item"><span class="av">🎖️</span><div><b>Sgt. Kamal</b><small>Returned from mission</small></div><span class="dot ok"></span></div>
              <div class="item"><span class="av">🎖️</span><div><b>Cpl. Adel</b><small>Sector B confirmed</small></div><span class="dot ok"></span></div>
              <div class="item warn"><span class="av">🎖️</span><div><b>Pvt. Hassan</b><small>Not confirmed yet</small></div><span class="dot amber"></span></div>
            </div>
          </div>
        }

        @case ('enlisted') {
          <div class="mk dash">
            <div class="row between"><b>📋 Enlisted Personnel</b><span class="badge blue">12,847 records</span></div>
            <div class="table">
              <div class="tr head"><span>ID</span><span>Name</span><span>Sector</span><span>Status</span></div>
              <div class="tr"><span>M-001</span><span>Ahmed M.</span><span>Cairo</span><span class="ok">Active</span></div>
              <div class="tr"><span>M-002</span><span>Youssef K.</span><span>Giza</span><span class="ok">Active</span></div>
              <div class="tr"><span>M-003</span><span>Omar S.</span><span>Alex</span><span class="amber">Transfer</span></div>
              <div class="tr"><span>M-004</span><span>Karim H.</span><span>Luxor</span><span class="ok">Active</span></div>
            </div>
          </div>
        }

        @case ('sectorreports') {
          <div class="mk dash">
            <div class="row between"><b>📊 Sector Reports</b><span class="badge blue">Q4 2024</span></div>
            <div class="chart">
              <div class="bar" style="--h:40%"></div>
              <div class="bar" style="--h:70%"></div>
              <div class="bar" style="--h:55%"></div>
              <div class="bar" style="--h:85%"></div>
              <div class="bar" style="--h:65%"></div>
              <div class="bar" style="--h:90%"></div>
            </div>
            <div class="row between subtle small"><span>Sector A</span><span>Sector B</span><span>Sector C</span></div>
          </div>
        }

        @case ('normalization') {
          <div class="mk norm">
            <div class="row between"><b>🔤 Arabic Normalization</b><span class="badge green">match 98%</span></div>
            <div class="match">
              <div class="side">
                <small>Input</small>
                <b>محمّــد  أحـمــد</b>
              </div>
              <div class="arrow">→</div>
              <div class="side">
                <small>Normalized</small>
                <b class="ok">محمد أحمد</b>
              </div>
            </div>
            <div class="rows">
              <div class="row-item"><b>علي  حسن</b><span class="ok">✓ matched</span></div>
              <div class="row-item"><b>فاطمـة  سعيد</b><span class="ok">✓ matched</span></div>
              <div class="row-item"><b>خالـد    سمير</b><span class="amber">⚠ fuzzy</span></div>
            </div>
          </div>
        }

        @case ('arroom') {
          <div class="mk scraper">
            <div class="row between"><b>🔍 Aggregating from 5 platforms</b><span class="badge amber">78%</span></div>
            <div class="progress"><div style="--w:78%"></div></div>
            <div class="sources">
              <span class="src">🛒 Amazon</span><span class="src">📦 Noon</span>
              <span class="src">🏬 Jumia</span><span class="src">🛍️ Souq</span>
              <span class="src">📱 OLX</span>
            </div>
            <div class="grid-3">
              <div class="prod"><div class="img"></div><b>Wireless Mouse</b><small>$24.99</small></div>
              <div class="prod"><div class="img"></div><b>Keyboard RGB</b><small>$59.00</small></div>
              <div class="prod"><div class="img"></div><b>USB Hub</b><small>$19.50</small></div>
            </div>
            <div class="banner green">📈 +30% engagement</div>
          </div>
        }

        @case ('almotafiq') {
          <div class="mk lms">
            <div class="row between"><b>📚 Al-Motafiq LMS</b><span class="badge purple">Live</span></div>
            <div class="lms-grid">
              <div class="teacher">👨‍🏫<b>Mr. Ali</b><small>Algebra</small></div>
              <div class="video">▶️ Live Stream</div>
            </div>
            <div class="students">
              <span>👦 Student 1</span><span>👧 Student 2</span>
              <span>👦 Student 3</span><span>👧 Student 4</span>
            </div>
            <div class="banner purple">📈 +25% student engagement</div>
          </div>
        }

        @case ('azaccounting') {
          <div class="mk acc">
            <div class="row between"><b>💰 AZ-Accounting</b><span class="badge green">Dec 2024</span></div>
            <div class="balance">EGP <b>2,847,330</b></div>
            <div class="rows">
              <div class="row-item"><span>🏢 Salaries</span><b class="neg">-480,000</b></div>
              <div class="row-item"><span>📦 Supplies</span><b class="neg">-120,500</b></div>
              <div class="row-item"><span>💵 Revenue</span><b class="pos">+1,240,000</b></div>
            </div>
            <div class="banner green">⏱️ -20% processing time</div>
          </div>
        }

        @case ('bwt') {
          <div class="mk bwt">
            <div class="bwt-head">BWT</div>
            <div class="bwt-tag">CLEAN · SOLID · TESTED</div>
            <div class="grid-3">
              <div class="card"><b class="ok">✓ SOLID</b><small>Principles</small></div>
              <div class="card"><b class="ok">✓ Browser</b><small>Cross-test</small></div>
              <div class="card"><b class="ok">✓ Clean</b><small>Architecture</small></div>
            </div>
          </div>
        }

        @case ('businessstep') {
          <div class="mk lp">
            <div class="lp-nav"><b>Business Step</b><span>Home · Services · Contact</span></div>
            <div class="lp-hero">
              <h3>Grow Your Business</h3>
              <p>Strategic consulting for modern enterprises</p>
              <button class="btn primary">Get Started →</button>
            </div>
            <div class="lp-feats">
              <span>📈 Growth</span><span>🎯 Strategy</span><span>💡 Innovation</span>
            </div>
          </div>
        }

        @case ('afkar') {
          <div class="mk jobs">
            <div class="row between pad"><b>💼 Afkar</b><input placeholder="Search jobs..." disabled /></div>
            <div class="jobs-list">
              <div class="job"><div><b>Senior Angular</b><small>TechCorp · Cairo</small></div><button class="btn primary">Apply</button></div>
              <div class="job"><div><b>.NET Backend</b><small>StartupX · Remote</small></div><button class="btn primary">Apply</button></div>
              <div class="job"><div><b>Full-Stack</b><small>FinBank · Hybrid</small></div><button class="btn primary">Apply</button></div>
            </div>
          </div>
        }

        @case ('ennwy') {
          <div class="mk shop">
            <div class="row between pad dark"><b>🛍️ Ennwy</b><span>🛒 (2)</span></div>
            <div class="grid-3 pad">
              <div class="item"><div class="img"></div><b>Headphones</b><small>$49</small></div>
              <div class="item"><div class="img"></div><b>Watch</b><small>$120</small></div>
              <div class="item"><div class="img"></div><b>Shoes</b><small>$75</small></div>
            </div>
          </div>
        }

        @case ('taskflow') {
          <div class="mk tf">
            <div class="row between"><b>🔥 TaskFlow</b><span class="badge amber">Streak: 12 days</span></div>
            <div class="tasks">
              <div class="task done"><span class="check">✓</span> Morning workout</div>
              <div class="task done"><span class="check">✓</span> Read 20 pages</div>
              <div class="task"><span class="check"></span> Code review</div>
              <div class="task"><span class="check"></span> Ship feature</div>
            </div>
            <div class="banner amber">🔥 Current: 12 · Longest: 34</div>
          </div>
        }

        @case ('omnisocial') {
          <div class="mk social">
            <div class="social-tabs">
              <span class="active">For You</span><span>Twitter</span><span>IG</span><span>TikTok</span>
            </div>
            <div class="post">
              <div class="post-head"><span class="av">👤</span><b>@ibrahim</b><small>2m</small></div>
              <div class="post-body">Just shipped OmniSocial 🚀 71 controllers, SignalR, JWT…</div>
              <div class="post-foot">❤️ 128 · 💬 24 · 🔁 12</div>
            </div>
            <div class="post">
              <div class="post-head"><span class="av">👤</span><b>@user2</b><small>5m</small></div>
              <div class="post-body">Live now in the studio 🔴</div>
            </div>
          </div>
        }

        @case ('quiz') {
          <div class="mk quiz">
            <div class="row between"><b>Q3 / 10</b><span class="badge purple">Score 2/2</span></div>
            <div class="q">What does ASP.NET Core use for state?</div>
            <div class="opts">
              <div class="opt">A. Sessions only</div>
              <div class="opt correct">B. DI Container</div>
              <div class="opt">C. Global vars</div>
              <div class="opt">D. Cookies only</div>
            </div>
            <div class="progress purple"><div style="--w:30%"></div></div>
          </div>
        }

        @case ('pm') {
          <div class="mk kanban">
            <div class="col"><div class="col-head">📝 To Do</div><div class="card">Design DB</div><div class="card">Auth flow</div></div>
            <div class="col"><div class="col-head">⚙️ Doing</div><div class="card">API endpoints</div></div>
            <div class="col"><div class="col-head">✅ Done</div><div class="card">Setup</div><div class="card">Migration</div></div>
          </div>
        }

        @case ('hotel') {
          <div class="mk hotel">
            <div class="row between"><b>🏨 Grand Nile Hotel</b><span class="amber">★★★★★</span></div>
            <div class="grid-3">
              <div class="room"><div class="img"></div><b>Deluxe</b><small>$180</small></div>
              <div class="room"><div class="img"></div><b>Suite</b><small>$320</small></div>
              <div class="room"><div class="img"></div><b>Presidential</b><small>$950</small></div>
            </div>
            <button class="btn primary">Book Now →</button>
          </div>
        }

        @case ('foody') {
          <div class="mk foody">
            <div class="row between"><b>🍔 Foody</b><span>🛒 3 items</span></div>
            <div class="grid-3">
              <div class="dish"><div class="img pizza"></div><b>Pizza</b><small>$12</small></div>
              <div class="dish"><div class="img burger"></div><b>Burger</b><small>$9</small></div>
              <div class="dish"><div class="img sushi"></div><b>Sushi</b><small>$18</small></div>
            </div>
          </div>
        }

        @case ('weather') {
          <div class="mk weather">
            <div class="w-head">☀️ Cairo, EG</div>
            <div class="w-temp">28°</div>
            <div class="w-sub">Sunny · Feels like 31°</div>
            <div class="w-days">
              <div><b>Mon</b><span>☀️</span><small>28°</small></div>
              <div><b>Tue</b><span>⛅</span><small>26°</small></div>
              <div><b>Wed</b><span>🌧️</span><small>22°</small></div>
            </div>
          </div>
        }

        @case ('boxshadow') {
          <div class="mk shadowgen">
            <div class="shadow-demo">Preview</div>
            <div class="shadow-controls">
              <div class="ctrl"><label>X</label><input type="range" value="8" disabled></div>
              <div class="ctrl"><label>Y</label><input type="range" value="8" disabled></div>
              <div class="ctrl"><label>Blur</label><input type="range" value="20" disabled></div>
              <div class="ctrl"><label>Spread</label><input type="range" value="0" disabled></div>
            </div>
            <code class="code">box-shadow: 8px 8px 20px rgba(0,0,0,.4);</code>
          </div>
        }

        @case ('imageeditor') {
          <div class="mk editor">
            <div class="toolbar">
              <button>✂️ Crop</button><button>🔄 Rotate</button>
              <button>🌗 Filter</button><button>💾 Save</button>
            </div>
            <div class="canvas"><div class="layer"></div></div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .frame {
      width: 100%;
      aspect-ratio: 16 / 10;
      background: var(--bg-code);
      border: 1px solid var(--border-soft);
      border-radius: 10px;
      overflow: hidden;
      position: relative;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      color: var(--text);
    }
    .mk { width: 100%; height: 100%; padding: 10px; display: flex; flex-direction: column; gap: 6px; }
    .row { display: flex; align-items: center; }
    .row.between { justify-content: space-between; }
    .row.end { justify-content: flex-end; }
    .row.gap-sm { gap: 6px; }
    .row.pad { padding: 0 6px; }
    .row.dark { background: #111; color: #fff; padding: 6px; }
    .subtle { color: #888; font-size: 7px; }
    .small { font-size: 7px; }
    b { font-weight: 700; }
    .dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
    .dot.amber { background: #f59e0b; }
    .dot.ok    { background: #22c55e; }
    .badge { font-size: 7px; padding: 2px 6px; border-radius: 8px; font-weight: 700; }
    .badge.amber  { background: #f59e0b; color: #1a1a1a; }
    .badge.blue   { background: #3b82f6; color: #fff; }
    .badge.green  { background: #22c55e; color: #fff; }
    .badge.purple { background: #a855f7; color: #fff; }
    .ok    { color: #22c55e; }
    .amber { color: #f59e0b; }
    .neg   { color: #ef4444; }
    .pos   { color: #22c55e; }
    .btn {
      background: var(--bg-hover);
      color: var(--text);
      border: 1px solid var(--border-soft);
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 8px;
    }
    .btn.primary { background: #3b82f6; color: #fff; border-color: #3b82f6; }
    .bar { height: 3px; background: var(--text-muted); opacity: .35; border-radius: 2px; margin: 3px 0; }
    .w-90 { width: 90%; } .w-75 { width: 75%; } .w-60 { width: 60%; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }

    .military { background: linear-gradient(180deg, #2a2a2a, #1a1a1a); }
    .military .field { background: #1f1f1f; padding: 4px 6px; border-radius: 3px; border-left: 2px solid #f59e0b; }
    .military .field span { display: block; font-size: 6px; color: #888; text-transform: uppercase; }
    .military .field b { font-size: 9px; }
    .military .doc { flex: 1; background: #1a1a1a; padding: 6px; border-radius: 3px; }

    .mobile { background: #000; align-items: stretch; }
    .mobile .app-title { font-size: 11px; font-weight: 700; margin: 4px 0; }
    .mobile .list { display: flex; flex-direction: column; gap: 4px; }
    .mobile .item {
      background: #1c1c1e; padding: 5px 7px; border-radius: 6px;
      display: flex; align-items: center; gap: 6px;
    }
    .mobile .item .av {
      width: 20px; height: 20px; border-radius: 50%;
      background: #333; display: grid; place-items: center; font-size: 10px;
    }
    .mobile .item b { font-size: 8px; }
    .mobile .item small { font-size: 6px; color: #888; display: block; }

    .dash { background: #1a1d21; }
    .dash .table { flex: 1; display: flex; flex-direction: column; gap: 2px; font-size: 7px; }
    .dash .tr { display: grid; grid-template-columns: 1fr 2fr 1fr 1.2fr; gap: 4px; padding: 3px 5px; background: #22262b; border-radius: 2px; }
    .dash .tr.head { background: #2d3238; font-weight: 700; color: #aaa; }
    .dash .chart { flex: 1; display: flex; align-items: flex-end; gap: 4px; padding: 6px 4px; background: #22262b; border-radius: 4px; }
    .dash .chart .bar { flex: 1; height: var(--h); background: linear-gradient(180deg, #4b8cff, #3b5bdb); border-radius: 2px 2px 0 0; }

    .norm { background: #0f172a; }
    .norm .match {
      display: flex; align-items: center; gap: 6px;
      background: #1e293b; border-radius: 4px; padding: 6px;
    }
    .norm .match .side { flex: 1; text-align: center; }
    .norm .match .side small { font-size: 6px; color: #888; display: block; }
    .norm .match .side b { font-size: 9px; }
    .norm .arrow { color: #888; }
    .norm .rows { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .norm .row-item { background: #1e293b; padding: 4px 7px; border-radius: 3px; display: flex; justify-content: space-between; font-size: 8px; }

    .scraper { background: #0f1419; }
    .scraper .progress { height: 4px; background: #1e2732; border-radius: 2px; overflow: hidden; }
    .scraper .progress > div { height: 100%; width: var(--w); background: linear-gradient(90deg, #ff9900, #ffb84d); }
    .scraper .sources { display: flex; gap: 3px; flex-wrap: wrap; }
    .scraper .src { background: #1e2732; padding: 2px 5px; border-radius: 3px; font-size: 7px; }
    .scraper .prod { background: #1e2732; padding: 3px; border-radius: 3px; text-align: center; }
    .scraper .prod .img { height: 22px; background: linear-gradient(135deg, #2d3748, #4a5568); border-radius: 2px; margin-bottom: 3px; }
    .scraper .prod b { font-size: 7px; display: block; }
    .scraper .prod small { font-size: 6px; color: #ff9900; }

    .banner { padding: 3px 6px; border-radius: 3px; font-size: 7px; text-align: center; font-weight: 700; color: #fff; }
    .banner.green  { background: linear-gradient(90deg, #16a34a, #22c55e); }
    .banner.purple { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
    .banner.amber  { background: linear-gradient(90deg, #f59e0b, #f97316); color: #1a1a1a; }

    .lms { background: #0d1117; }
    .lms .lms-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 4px; }
    .lms .teacher { background: #161b22; padding: 6px; border-radius: 4px; display: flex; flex-direction: column; align-items: center; }
    .lms .teacher b { font-size: 8px; margin-top: 3px; }
    .lms .teacher small { font-size: 6px; color: #888; }
    .lms .video {
      background: linear-gradient(135deg, #1f6feb, #8b5cf6);
      border-radius: 4px; display: grid; place-items: center;
      color: #fff; font-size: 9px; font-weight: 700;
    }
    .lms .students { display: flex; gap: 3px; flex-wrap: wrap; }
    .lms .students span { background: #161b22; padding: 2px 5px; border-radius: 10px; font-size: 6px; }

    .acc { background: #0f172a; }
    .acc .balance { font-size: 9px; color: #94a3b8; }
    .acc .balance b { font-size: 16px; color: #10b981; display: block; }
    .acc .rows { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .acc .row-item { display: flex; justify-content: space-between; background: #1e293b; padding: 4px 7px; border-radius: 3px; font-size: 8px; }

    .bwt { background: #0a0a0a; justify-content: center; align-items: center; }
    .bwt .bwt-head { font-size: 20px; font-weight: 900; letter-spacing: 5px; color: #fff; }
    .bwt .bwt-tag { font-size: 7px; color: #888; letter-spacing: 2px; margin-bottom: 6px; }
    .bwt .card { background: #161616; padding: 6px; border-radius: 4px; border: 1px solid #2a2a2a; text-align: center; }
    .bwt .card b { font-size: 8px; display: block; }
    .bwt .card small { color: #888; font-size: 6px; }

    .lp { background: #fff; color: #111; padding: 0; }
    .lp .lp-nav { display: flex; justify-content: space-between; padding: 5px 8px; background: #f8fafc; font-size: 7px; border-bottom: 1px solid #e2e8f0; }
    .lp .lp-nav b { color: #0ea5e9; }
    .lp .lp-hero {
      flex: 1; background: linear-gradient(135deg, #0ea5e9, #6366f1);
      color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 10px;
    }
    .lp .lp-hero h3 { font-size: 13px; }
    .lp .lp-hero p { font-size: 7px; opacity: .9; }
    .lp .lp-feats { display: flex; gap: 5px; padding: 6px; justify-content: center; font-size: 7px; }
    .lp .lp-feats span { background: #f1f5f9; padding: 3px 7px; border-radius: 10px; }

    .jobs { background: #f8fafc; color: #0f172a; padding: 0; }
    .jobs input { background: #1e293b; border: none; color: #fff; padding: 2px 5px; border-radius: 3px; font-size: 7px; width: 100px; }
    .jobs .jobs-list { flex: 1; padding: 6px; display: flex; flex-direction: column; gap: 4px; }
    .jobs .job { display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 6px 8px; border-radius: 4px; border: 1px solid #e2e8f0; }
    .jobs .job b { font-size: 8px; color: #0f172a; }
    .jobs .job small { font-size: 6px; color: #64748b; display: block; }
    .jobs .btn.primary { background: #0ea5e9; border-color: #0ea5e9; }

    .shop { background: #fff; color: #0f172a; padding: 0; }
    .shop .grid-3 { flex: 1; }
    .shop .item { background: #f1f5f9; padding: 4px; border-radius: 4px; text-align: center; }
    .shop .item .img { height: 26px; background: linear-gradient(135deg, #cbd5e1, #94a3b8); border-radius: 2px; margin-bottom: 3px; }
    .shop .item b { font-size: 7px; }
    .shop .item small { color: #0ea5e9; font-size: 7px; font-weight: 700; }

    .tf { background: #0f172a; }
    .tf .tasks { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .tf .task { background: #1e293b; padding: 4px 6px; border-radius: 3px; font-size: 8px; display: flex; align-items: center; gap: 5px; }
    .tf .task.done { opacity: .55; text-decoration: line-through; }
    .tf .check { width: 10px; height: 10px; border: 1px solid #475569; border-radius: 2px; display: grid; place-items: center; font-size: 7px; }
    .tf .task.done .check { background: #10b981; border-color: #10b981; color: #fff; }

    .social { background: #000; }
    .social .social-tabs { display: flex; gap: 2px; border-bottom: 1px solid #222; }
    .social .social-tabs span { padding: 3px 6px; font-size: 7px; color: #666; }
    .social .social-tabs span.active { color: #fff; border-bottom: 2px solid #1d9bf0; font-weight: 700; }
    .social .post { background: #16181c; padding: 6px; border-radius: 5px; }
    .social .post-head { display: flex; align-items: center; gap: 4px; font-size: 7px; }
    .social .post-head .av { width: 14px; height: 14px; border-radius: 50%; background: #333; display: grid; place-items: center; font-size: 7px; }
    .social .post-head b { color: #fff; }
    .social .post-head small { color: #666; margin-left: auto; }
    .social .post-body { font-size: 8px; margin: 3px 0; color: #e7e9ea; }
    .social .post-foot { font-size: 7px; color: #666; }

    .quiz { background: #0f0f23; }
    .quiz .q { font-size: 9px; color: #fff; font-weight: 600; margin: 4px 0; }
    .quiz .opts { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .quiz .opt { background: #1e1e3f; padding: 4px 6px; border-radius: 4px; font-size: 7px; color: #cbd5e1; }
    .quiz .opt.correct { background: #10b981; color: #fff; font-weight: 700; }
    .quiz .progress { height: 3px; background: #1e1e3f; border-radius: 2px; overflow: hidden; }
    .quiz .progress > div { height: 100%; width: var(--w); background: #a78bfa; }

    .kanban { background: #0f172a; padding: 6px; flex-direction: row; gap: 4px; }
    .kanban .col { flex: 1; background: #1e293b; border-radius: 4px; padding: 4px; display: flex; flex-direction: column; gap: 3px; }
    .kanban .col-head { font-size: 7px; color: #94a3b8; font-weight: 700; margin-bottom: 2px; }
    .kanban .card { background: #334155; padding: 4px 5px; border-radius: 3px; font-size: 7px; color: #e2e8f0; }

    .hotel { background: #1a1a2e; }
    .hotel .room { background: #252540; padding: 4px; border-radius: 4px; text-align: center; }
    .hotel .room .img { height: 24px; background: linear-gradient(135deg, #7c3aed, #f59e0b); border-radius: 3px; margin-bottom: 3px; }
    .hotel .room b { font-size: 7px; color: #fff; }
    .hotel .room small { font-size: 6px; color: #fbbf24; }

    .foody { background: #fff8f0; color: #1a1a1a; }
    .foody .row b { color: #dc2626; }
    .foody .dish { background: #fff; padding: 4px; border-radius: 4px; text-align: center; border: 1px solid #fee2e2; }
    .foody .dish .img { height: 22px; border-radius: 3px; margin-bottom: 3px; }
    .foody .img.pizza  { background: linear-gradient(135deg, #fbbf24, #dc2626); }
    .foody .img.burger { background: linear-gradient(135deg, #92400e, #f59e0b); }
    .foody .img.sushi  { background: linear-gradient(135deg, #0891b2, #22d3ee); }
    .foody .dish b { font-size: 7px; }
    .foody .dish small { color: #dc2626; font-weight: 700; font-size: 7px; }

    .weather { background: linear-gradient(180deg, #1e3a8a, #0c4a6e); color: #fff; align-items: center; }
    .weather .w-head { font-size: 9px; }
    .weather .w-temp { font-size: 34px; font-weight: 300; line-height: 1; margin: 3px 0; }
    .weather .w-sub { font-size: 7px; opacity: .8; }
    .weather .w-days { flex: 1; display: flex; gap: 5px; align-items: flex-end; }
    .weather .w-days > div { background: rgba(255,255,255,.1); padding: 4px 6px; border-radius: 4px; text-align: center; flex: 1; }
    .weather .w-days b { display: block; font-size: 6px; opacity: .7; }
    .weather .w-days span { font-size: 12px; }
    .weather .w-days small { font-size: 7px; }

    .shadowgen { background: #1e1e1e; }
    .shadowgen .shadow-demo {
      background: #fff; color: #000; padding: 10px; text-align: center;
      border-radius: 6px; font-weight: 700;
      box-shadow: 8px 8px 20px rgba(0,0,0,.4);
      margin: 4px 8px;
    }
    .shadowgen .shadow-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
    .shadowgen .ctrl { display: flex; align-items: center; gap: 4px; font-size: 7px; }
    .shadowgen .ctrl label { width: 34px; color: #888; }
    .shadowgen .ctrl input[type=range] { flex: 1; accent-color: #e879f9; height: 3px; }
    .shadowgen .code { background: #0a0a0a; padding: 4px 6px; border-radius: 3px; font-size: 7px; color: #e879f9; }

    .editor { background: #0a0a0a; padding: 0; }
    .editor .toolbar { display: flex; gap: 2px; padding: 5px; background: #161616; }
    .editor .toolbar button { background: #222; color: #fff; border: none; padding: 3px 6px; font-size: 7px; border-radius: 3px; }
    .editor .canvas {
      flex: 1;
      background-image:
        linear-gradient(45deg, #1a1a1a 25%, transparent 25%),
        linear-gradient(-45deg, #1a1a1a 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #1a1a1a 75%),
        linear-gradient(-45deg, transparent 75%, #1a1a1a 75%);
      background-size: 12px 12px;
      background-position: 0 0, 0 6px, 6px -6px, -6px 0;
      display: grid; place-items: center;
    }
    .editor .layer { width: 60%; height: 60%; background: linear-gradient(135deg, #8b5cf6, #ec4899); border-radius: 6px; }
  `],
})
export class MiniPreview {
  kind = input.required<DemoKind>();
}