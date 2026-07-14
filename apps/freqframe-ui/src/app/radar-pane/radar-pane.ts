import {
  Component,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { environment } from '../../environments/environment';

interface RainViewerFrame {
  time: number;
  path: string;
}

interface RainViewerResponse {
  host: string;
  radar: {
    past: RainViewerFrame[];
    nowcast: RainViewerFrame[];
  };
}

const RADAR_OPACITY = 0.65;

@Component({
  selector: 'app-radar-pane',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './radar-pane.html',
  styleUrl: './radar-pane.css',
})
export class RadarPane implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private http = inject(HttpClient);
  private map?: L.Map;
  private radarLayers: L.TileLayer[] = [];
  private animFrames: RainViewerFrame[] = [];
  private currentFrameIndex = 0;
  private animTimer?: ReturnType<typeof setInterval>;

  isLoading = true;
  hasError = false;
  frameTime: Date | null = null;

  ngAfterViewInit(): void {
    this.initMap();
    this.loadRadarFrames();
  }

  ngOnDestroy(): void {
    if (this.animTimer) clearInterval(this.animTimer);
    if (this.map) this.map.remove();
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [environment.radar.lat, environment.radar.lon],
      zoom: environment.radar.zoom,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(this.map);
  }

  private loadRadarFrames(): void {
    this.http.get<RainViewerResponse>('https://api.rainviewer.com/public/weather-maps.json').subscribe({
      next: (data) => {
        this.animFrames = data.radar.past.slice(-12);
        const host = data.host;

        this.radarLayers = this.animFrames.map((frame) =>
          L.tileLayer(`${host}${frame.path}/512/{z}/{x}/{y}/2/1_1.png`, {
            opacity: 0,
            tileSize: 512,
            zIndex: 10,
          })
        );

        // Add every frame layer up front (hidden via opacity 0) so each frame's
        // tiles are fetched from RainViewer exactly once. Animating by
        // add/removeLayer instead forces Leaflet to re-fetch a frame's tiles
        // every time it comes back around, which is what was tripping
        // RainViewer's rate limiting on a display that runs the animation
        // continuously for hours.
        this.radarLayers.forEach((layer) => layer.addTo(this.map!));

        this.isLoading = false;
        this.showFrame(this.animFrames.length - 1);
        this.startAnimation();
      },
      error: (err) => {
        console.error('Radar data unavailable:', err);
        this.isLoading = false;
        this.hasError = true;
      },
    });
  }

  private showFrame(index: number): void {
    if (!this.map || this.radarLayers.length === 0) return;

    if (this.radarLayers[this.currentFrameIndex]) {
      this.radarLayers[this.currentFrameIndex].setOpacity(0);
    }

    this.currentFrameIndex = index;
    this.radarLayers[index].setOpacity(RADAR_OPACITY);
    this.frameTime = new Date(this.animFrames[index].time * 1000);
  }

  private startAnimation(): void {
    this.animTimer = setInterval(() => {
      const next = (this.currentFrameIndex + 1) % this.radarLayers.length;
      this.showFrame(next);
    }, 600);
  }
}
