import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef,
  OnDestroy, inject, viewChild,
} from '@angular/core';
import { ProjectsService } from '../../core/services/projects.service';
import { ViewModeService } from '../../core/services/view-mode.service';
import { RecruiterContactComponent } from './sections/recruiter-contact/recruiter-contact';
import { RecruiterExperienceComponent } from './sections/recruiter-experience/recruiter-experience';
import { RecruiterHeroComponent } from './sections/recruiter-hero/recruiter-hero';
import { RecruiterImpactComponent } from './sections/recruiter-impact/recruiter-impact';
import { RecruiterProjectsComponent } from './sections/recruiter-projects/recruiter-projects';
import { RecruiterSkillsComponent } from './sections/recruiter-skills/recruiter-skills';

@Component({
  selector: 'app-recruiter-view',
  standalone: true,
  imports: [
    RecruiterHeroComponent,
    RecruiterImpactComponent,
    RecruiterProjectsComponent,
    RecruiterExperienceComponent,
    RecruiterSkillsComponent,
    RecruiterContactComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rv" #scrollRoot>
      <app-recruiter-hero />
      <app-recruiter-impact />
      <app-recruiter-projects />
      <app-recruiter-experience />
      <app-recruiter-skills />
      <app-recruiter-contact />
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 0;
      overflow: hidden;
    }

    .rv {
      width: 100%;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
    }

    @media (max-width: 640px) {
      .rv { scroll-behavior: auto; }
    }
    
  `],
})
export class RecruiterViewComponent implements AfterViewInit, OnDestroy {
  readonly svc = inject(ProjectsService);
  readonly viewMode = inject(ViewModeService);
  readonly scrollRoot = viewChild.required<ElementRef<HTMLElement>>('scrollRoot');

  private ctx?: any;

  async ngAfterViewInit(): Promise<void> {
    const { gsap } = await import('gsap');
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');
    const { ScrollToPlugin } = await import('gsap/ScrollToPlugin');

    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    const root = this.scrollRoot().nativeElement;

    // Defer 2 frames — ensures layout complete + all children rendered
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    ScrollTrigger.defaults({ scroller: root });

    this.ctx = gsap.context(() => {

      // ─── PROJECT CARDS ─────────────────────────
      gsap.set('.ad', { opacity: 0, y: 40 });

      ScrollTrigger.batch('.ad', {
        start: 'top 92%',
        once: true,
        onEnter: (els) => {
          gsap.to(els, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: 'power3.out',
            overwrite: true,
          });
        },
      });

      // ─── EXPERIENCE CHIPS ──────────────────────
      gsap.set('.chip', { opacity: 0, x: -40 });

      ScrollTrigger.batch('.chip', {
        start: 'top 92%',
        once: true,
        onEnter: (els) => {
          gsap.to(els, {
            opacity: 1,
            x: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power3.out',
            overwrite: true,
          });
        },
      });

      // ─── SKILLS BAYS ───────────────────────────
      gsap.set('.bay', { opacity: 0, y: 40 });

      ScrollTrigger.batch('.bay', {
        start: 'top 92%',
        once: true,
        onEnter: (els) => {
          gsap.to(els, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power3.out',
            overwrite: true,
          });
        },
      });

      // ─── IMPACT DATASHEET ROWS ─────────────────
      gsap.set('.sheet-row', { opacity: 0, y: 24 });

      ScrollTrigger.batch('.sheet-row', {
        start: 'top 94%',
        once: true,
        onEnter: (els) => {
          gsap.to(els, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.06,
            ease: 'power2.out',
            overwrite: true,
          });
        },
      });

      // ─── CONTACT ROWS ──────────────────────────
      gsap.set('.contact-row', { opacity: 0, x: -24 });

      ScrollTrigger.batch('.contact-row', {
        start: 'top 95%',
        once: true,
        onEnter: (els) => {
          gsap.to(els, {
            opacity: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.06,
            ease: 'power2.out',
            overwrite: true,
          });
        },
      });

      // ─── SECTION HEADERS ───────────────────────
      gsap.utils.toArray<HTMLElement>('.section-head').forEach(el => {
        gsap.fromTo(el,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          },
        );
      });

      // ─── SKILL BARS (RAM) ──────────────────────
      gsap.utils.toArray<HTMLElement>('.ram-fill').forEach(el => {
        const level = Number(el.dataset['level'] ?? 0);
        gsap.fromTo(el,
          { width: '0%' },
          {
            width: `${level}%`,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 95%', once: true },
          },
        );
      });

    }, root);

    // Force refresh after everything settles
    setTimeout(() => ScrollTrigger.refresh(), 150);
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}