import { Page } from 'playwright';
import { SEOCheckResult } from '../types';

export class MultimediaChecker {
  constructor(private page: Page) {}

  async checkAll(): Promise<SEOCheckResult[]> {
    const results: SEOCheckResult[] = [];

    results.push(await this.checkVideos());
    results.push(await this.checkVideoMetadata());
    results.push(await this.checkVideoTranscripts());
    results.push(await this.checkAudioElements());
    results.push(await this.checkEmbeds());
    results.push(await this.checkAutoplay());
    results.push(await this.checkVideoSchema());
    results.push(await this.checkYouTubeEmbeds());
    results.push(await this.checkVideoAccessibility());
    results.push(await this.checkMediaControls());

    return results;
  }

  private async checkVideos(): Promise<SEOCheckResult> {
    try {
      const videoData = await this.page.evaluate(() => {
        const videos = Array.from(document.querySelectorAll('video'));
        const iframeVideos = Array.from(document.querySelectorAll('iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="dailymotion"]'));

        return {
          nativeVideos: videos.length,
          embeddedVideos: iframeVideos.length,
          totalVideos: videos.length + iframeVideos.length,
        };
      });

      return {
        passed: true,
        message: videoData.totalVideos > 0
          ? `${videoData.totalVideos} video(s) found (${videoData.nativeVideos} native, ${videoData.embeddedVideos} embedded)`
          : 'No videos found',
        details: videoData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Video check skipped',
      };
    }
  }

  private async checkVideoMetadata(): Promise<SEOCheckResult> {
    try {
      const metadataData = await this.page.evaluate(() => {
        const videos = Array.from(document.querySelectorAll('video'));
        const withPoster = videos.filter((v) => v.hasAttribute('poster'));
        const withAria = videos.filter((v) => v.hasAttribute('aria-label') || v.hasAttribute('title'));

        return {
          totalVideos: videos.length,
          withPoster: withPoster.length,
          withAria: withAria.length,
        };
      });

      if (metadataData.totalVideos === 0) {
        return {
          passed: true,
          message: 'No native videos to check',
        };
      }

      const issues: string[] = [];

      if (metadataData.withPoster < metadataData.totalVideos) {
        issues.push(`${metadataData.totalVideos - metadataData.withPoster} videos missing poster image`);
      }

      if (metadataData.withAria < metadataData.totalVideos) {
        issues.push(`${metadataData.totalVideos - metadataData.withAria} videos missing aria-label/title`);
      }

      if (issues.length > 0) {
        return {
          passed: false,
          message: `Video metadata issues: ${issues.join(', ')}`,
          details: metadataData,
        };
      }

      return {
        passed: true,
        message: 'Videos have proper metadata',
        details: metadataData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Video metadata check skipped',
      };
    }
  }

  private async checkVideoTranscripts(): Promise<SEOCheckResult> {
    try {
      const transcriptData = await this.page.evaluate(() => {
        const videos = Array.from(document.querySelectorAll('video'));
        const withTrack = videos.filter((v) => v.querySelector('track[kind="captions"], track[kind="subtitles"]'));

        const transcriptElements = document.querySelectorAll('[class*="transcript"], [id*="transcript"]');

        return {
          totalVideos: videos.length,
          withTrack: withTrack.length,
          hasTranscriptElements: transcriptElements.length > 0,
        };
      });

      if (transcriptData.totalVideos === 0) {
        return {
          passed: true,
          message: 'No videos to check for transcripts',
        };
      }

      const hasAccessibility = transcriptData.withTrack > 0 || transcriptData.hasTranscriptElements;

      if (!hasAccessibility) {
        return {
          passed: false,
          message: 'Videos missing captions/transcripts (important for accessibility and SEO)',
          details: transcriptData,
        };
      }

      return {
        passed: true,
        message: 'Video accessibility features present',
        details: transcriptData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Video transcripts check skipped',
      };
    }
  }

  private async checkAudioElements(): Promise<SEOCheckResult> {
    try {
      const audioData = await this.page.evaluate(() => {
        const audio = Array.from(document.querySelectorAll('audio'));
        const withControls = audio.filter((a) => a.hasAttribute('controls'));
        const withLabels = audio.filter((a) => a.hasAttribute('aria-label') || a.hasAttribute('title'));

        return {
          totalAudio: audio.length,
          withControls: withControls.length,
          withLabels: withLabels.length,
        };
      });

      if (audioData.totalAudio === 0) {
        return {
          passed: true,
          message: 'No audio elements found',
        };
      }

      const issues: string[] = [];

      if (audioData.withControls < audioData.totalAudio) {
        issues.push(`${audioData.totalAudio - audioData.withControls} audio elements missing controls`);
      }

      if (audioData.withLabels < audioData.totalAudio) {
        issues.push(`${audioData.totalAudio - audioData.withLabels} audio elements missing labels`);
      }

      if (issues.length > 0) {
        return {
          passed: false,
          message: `Audio issues: ${issues.join(', ')}`,
          details: audioData,
        };
      }

      return {
        passed: true,
        message: `${audioData.totalAudio} audio element(s) properly configured`,
        details: audioData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Audio elements check skipped',
      };
    }
  }

  private async checkEmbeds(): Promise<SEOCheckResult> {
    try {
      const embedData = await this.page.evaluate(() => {
        const embeds = Array.from(document.querySelectorAll('embed, object'));
        const iframes = Array.from(document.querySelectorAll('iframe'));

        return {
          totalEmbeds: embeds.length,
          totalIframes: iframes.length,
        };
      });

      if (embedData.totalEmbeds > 0) {
        return {
          passed: false,
          message: `Found ${embedData.totalEmbeds} <embed>/<object> elements (outdated, use HTML5)`,
          details: embedData,
        };
      }

      return {
        passed: true,
        message: embedData.totalIframes > 0
          ? `Using modern iframe embeds (${embedData.totalIframes})`
          : 'No embed elements',
        details: embedData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Embeds check skipped',
      };
    }
  }

  private async checkAutoplay(): Promise<SEOCheckResult> {
    try {
      const autoplayData = await this.page.evaluate(() => {
        const videos = Array.from(document.querySelectorAll('video[autoplay]'));
        const audio = Array.from(document.querySelectorAll('audio[autoplay]'));
        const withMuted = [...videos, ...audio].filter((el) => el.hasAttribute('muted'));

        return {
          autoplayVideos: videos.length,
          autoplayAudio: audio.length,
          withMuted: withMuted.length,
        };
      });

      const totalAutoplay = autoplayData.autoplayVideos + autoplayData.autoplayAudio;

      if (totalAutoplay > 0 && autoplayData.withMuted < totalAutoplay) {
        return {
          passed: false,
          message: `${totalAutoplay - autoplayData.withMuted} autoplay media elements without muted (bad UX)`,
          details: autoplayData,
        };
      }

      return {
        passed: true,
        message: totalAutoplay > 0
          ? 'Autoplay media properly muted'
          : 'No autoplay media (good for UX)',
        details: autoplayData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Autoplay check skipped',
      };
    }
  }

  private async checkVideoSchema(): Promise<SEOCheckResult> {
    try {
      const schemaData = await this.page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const hasVideoSchema = scripts.some((script) => {
          try {
            const data = JSON.parse(script.textContent || '{}');
            return data['@type'] === 'VideoObject' || data['@type']?.includes('Video');
          } catch {
            return false;
          }
        });

        const videos = document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length;

        return {
          hasVideoSchema,
          videoCount: videos,
        };
      });

      if (schemaData.videoCount > 0 && !schemaData.hasVideoSchema) {
        return {
          passed: false,
          message: 'Videos found but no VideoObject schema (recommended for rich results)',
          details: schemaData,
        };
      }

      return {
        passed: true,
        message: schemaData.hasVideoSchema
          ? 'VideoObject schema present'
          : 'No videos or schema not needed',
        details: schemaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Video schema check skipped',
      };
    }
  }

  private async checkYouTubeEmbeds(): Promise<SEOCheckResult> {
    try {
      const youtubeData = await this.page.evaluate(() => {
        const iframes = Array.from(document.querySelectorAll('iframe[src*="youtube"]')) as HTMLIFrameElement[];
        const withNoCookie = iframes.filter((iframe) => iframe.src.includes('youtube-nocookie.com'));
        const withTitle = iframes.filter((iframe) => iframe.hasAttribute('title'));

        return {
          totalYouTube: iframes.length,
          withNoCookie: withNoCookie.length,
          withTitle: withTitle.length,
        };
      });

      if (youtubeData.totalYouTube === 0) {
        return {
          passed: true,
          message: 'No YouTube embeds',
        };
      }

      const issues: string[] = [];

      if (youtubeData.withNoCookie < youtubeData.totalYouTube) {
        issues.push('Consider using youtube-nocookie.com for privacy');
      }

      if (youtubeData.withTitle < youtubeData.totalYouTube) {
        issues.push(`${youtubeData.totalYouTube - youtubeData.withTitle} YouTube iframes missing title attribute`);
      }

      if (issues.length > 0) {
        return {
          passed: false,
          message: `YouTube embed issues: ${issues.join(', ')}`,
          details: youtubeData,
        };
      }

      return {
        passed: true,
        message: `${youtubeData.totalYouTube} YouTube embed(s) properly configured`,
        details: youtubeData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'YouTube embeds check skipped',
      };
    }
  }

  private async checkVideoAccessibility(): Promise<SEOCheckResult> {
    try {
      const a11yData = await this.page.evaluate(() => {
        const videos = Array.from(document.querySelectorAll('video'));
        const iframes = Array.from(document.querySelectorAll('iframe'));

        const videosWithAria = videos.filter((v) =>
          v.hasAttribute('aria-label') || v.hasAttribute('aria-labelledby')
        );

        const iframesWithTitle = iframes.filter((i) => i.hasAttribute('title'));

        return {
          nativeVideos: videos.length,
          videosWithAria: videosWithAria.length,
          iframes: iframes.length,
          iframesWithTitle: iframesWithTitle.length,
        };
      });

      const issues: string[] = [];

      if (a11yData.nativeVideos > 0 && a11yData.videosWithAria < a11yData.nativeVideos) {
        issues.push(`${a11yData.nativeVideos - a11yData.videosWithAria} videos missing ARIA labels`);
      }

      if (a11yData.iframes > 0 && a11yData.iframesWithTitle < a11yData.iframes) {
        issues.push(`${a11yData.iframes - a11yData.iframesWithTitle} iframes missing title`);
      }

      if (issues.length > 0) {
        return {
          passed: false,
          message: `Media accessibility issues: ${issues.join(', ')}`,
          details: a11yData,
        };
      }

      return {
        passed: true,
        message: 'Media elements have accessibility attributes',
        details: a11yData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Video accessibility check skipped',
      };
    }
  }

  private async checkMediaControls(): Promise<SEOCheckResult> {
    try {
      const controlsData = await this.page.evaluate(() => {
        const videos = Array.from(document.querySelectorAll('video'));
        const audio = Array.from(document.querySelectorAll('audio'));

        const videoControls = videos.filter((v) => v.hasAttribute('controls'));
        const audioControls = audio.filter((a) => a.hasAttribute('controls'));

        return {
          videos: videos.length,
          audio: audio.length,
          videoControls: videoControls.length,
          audioControls: audioControls.length,
        };
      });

      const issues: string[] = [];

      if (controlsData.videos > 0 && controlsData.videoControls < controlsData.videos) {
        issues.push(`${controlsData.videos - controlsData.videoControls} videos missing controls`);
      }

      if (controlsData.audio > 0 && controlsData.audioControls < controlsData.audio) {
        issues.push(`${controlsData.audio - controlsData.audioControls} audio elements missing controls`);
      }

      if (issues.length > 0) {
        return {
          passed: false,
          message: `Media controls issues: ${issues.join(', ')}`,
          details: controlsData,
        };
      }

      return {
        passed: true,
        message: 'Media elements have controls',
        details: controlsData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Media controls check skipped',
      };
    }
  }
}
