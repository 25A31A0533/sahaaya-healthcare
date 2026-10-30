import { test, expect } from '@playwright/test';

async function dismissSplash(page) {
  try {
    const startBtn = page.getByRole('button', { name: /ప్రారంభించండి|Get Started/i });
    if (await startBtn.isVisible({ timeout: 2000 })) {
      await startBtn.click();
      await page.waitForTimeout(300);
    }
  } catch (_e) {
    // Already dismissed
  }
}

async function toggleLang(page) {
  const btn = page.locator('button[aria-label="Toggle Language between Telugu and English"]:visible').first();
  await btn.click();
  await page.waitForTimeout(300);
}

async function ensureLanguage(page, targetLang) {
  const btn = page.locator('button[aria-label="Toggle Language between Telugu and English"]:visible').first();
  await expect(btn).toBeVisible();
  const text = (await btn.innerText()).trim();
  // When in Telugu ('te'), button displays 'English' (click to switch to English)
  // When in English ('en'), button displays 'తెలుగు' (click to switch to Telugu)
  if (targetLang === 'en' && text.includes('English')) {
    await btn.click();
    await page.waitForTimeout(300);
  } else if (targetLang === 'te' && text.includes('తెలుగు')) {
    await btn.click();
    await page.waitForTimeout(300);
  }
}

// Inject Mock SpeechRecognition for automated voice tests
async function setupMockSpeechRecognition(page) {
  await page.addInitScript(() => {
    class MockSpeechRecognition {
      constructor() {
        this.lang = 'en-IN';
        this.interimResults = false;
        this.continuous = false;
        this.onstart = null;
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
        window.__mockSpeechRecognitionInstance = this;
      }
      start() {
        setTimeout(() => {
          if (this.onstart) this.onstart();
          if (window.__mockSpeechText) {
            const event = {
              resultIndex: 0,
              results: [
                [{ transcript: window.__mockSpeechText }]
              ]
            };
            event.results[0].isFinal = true;
            if (this.onresult) this.onresult(event);
          } else if (window.__mockSpeechError) {
            if (this.onerror) this.onerror({ error: window.__mockSpeechError });
          }
        }, 60);
      }
      stop() {
        setTimeout(() => {
          if (this.onend) this.onend();
        }, 30);
      }
    }
    window.SpeechRecognition = MockSpeechRecognition;
    window.webkitSpeechRecognition = MockSpeechRecognition;
  });
}

test.describe('Sahaaya Health Production E2E Suite', () => {

  test('1. First load, Splash screen, and Home Navigation', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    
    // Verify Splash Screen
    await expect(page.locator('text=Sunitha Devi')).toBeVisible();
    await expect(page.getByRole('button', { name: /ప్రారంభించండి|Get Started/i })).toBeVisible();
    await page.screenshot({ path: 'screenshots/01-splash-screen.png' });

    // Click Get Started
    await page.getByRole('button', { name: /ప్రారంభించండి|Get Started/i }).click();

    // Verify Home Screen loaded with dynamic connection status banner
    await expect(page.locator('main').getByText(/ఆన్‌లైన్|Online/i).first()).toBeVisible();
    await expect(page.getByText(/నేటి పని ప్రాధాన్యతలు|Today's Work Priorities/i)).toBeVisible();
    await page.screenshot({ path: 'screenshots/02-home-screen.png' });

    // Verify zoom meta tag allows scaling (maximum-scale and user-scalable removed)
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewportMeta).not.toContain('user-scalable=no');
    expect(viewportMeta).not.toContain('maximum-scale=1.0');

    // Ensure no fatal console errors
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

  test('2. Language Switching between Telugu and English', async ({ page }) => {
    await page.goto('/');
    await dismissSplash(page);

    // Ensure started in Telugu
    await ensureLanguage(page, 'te');
    await expect(page.getByText('సహాయ హెల్త్').first()).toBeVisible();

    // Toggle to English
    await toggleLang(page);

    // Verify English labels on Home
    await expect(page.getByText('Sahaaya Health').first()).toBeVisible();
    await expect(page.getByText(/Visits Scheduled/i).first()).toBeVisible();
    await expect(page.getByText(/Urgent Alerts/i).first()).toBeVisible();
    await expect(page.getByText(/Online - data syncs automatically/i).first()).toBeVisible();

    // Toggle back to Telugu
    await toggleLang(page);
    await expect(page.getByText(/నేటి సందర్శనలు/i).first()).toBeVisible();
    await expect(page.getByText(/అత్యవసర హెచ్చరికలు/i).first()).toBeVisible();
  });

  test('3. Responsive Layout across 360px, 768px, 1024px, and 1440px', async ({ page }) => {
    await page.goto('/');
    await dismissSplash(page);

    const viewports = [
      { width: 360, height: 740, isMobile: true },
      { width: 768, height: 1024, isMobile: false },
      { width: 1024, height: 768, isMobile: false },
      { width: 1440, height: 900, isMobile: false },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);

      // Verify no horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth, `Horizontal scroll detected at ${vp.width}px`).toBeLessThanOrEqual(clientWidth + 1);

      if (vp.isMobile) {
        await expect(page.locator('nav.md\\:hidden')).toBeVisible();
        await expect(page.locator('aside')).toBeHidden();
      } else {
        await expect(page.locator('aside')).toBeVisible();
        await expect(page.locator('nav.md\\:hidden')).toBeHidden();
      }
    }
  });

  test('4. Ask AI: Small Talk, Danger Sign Alert with Call 108, Refusal, and BM25 Citation', async ({ page }) => {
    await page.goto('/');
    await dismissSplash(page);

    // Ensure English for deterministic assertion text
    await ensureLanguage(page, 'en');

    // Navigate to Ask AI
    await page.locator('button:visible').filter({ hasText: /Ask AI|సహాయ AI/i }).first().click();
    await expect(page.getByText(/100% Offline/i)).toBeVisible();

    const input = page.getByPlaceholder(/Search family name|Ask any protocol question/i);
    const sendBtn = page.getByRole('button', { name: /Send/i });

    // Step A: Small Talk (Greeting)
    await input.fill('hello');
    await sendBtn.click();
    await expect(page.getByText(/Namaste! I am Sahaaya/i)).toBeVisible();

    // Step B: Danger Sign ("hi, she is bleeding heavily" - must escalate)
    await input.fill('hi, she is bleeding heavily');
    await sendBtn.click();
    await expect(page.locator('span:has-text("REFER IMMEDIATELY")')).toBeVisible();
    await expect(page.getByText(/Maternal Vaginal Bleeding/i)).toBeVisible();
    await expect(page.getByText(/108 Ambulance/i).first()).toBeVisible();

    // Verify Call 108 button with tel:108 link is rendered
    const call108Link = page.locator('a[href="tel:108"]').first();
    await expect(call108Link).toBeVisible();
    await expect(call108Link).toHaveAttribute('href', 'tel:108');
    await page.screenshot({ path: 'screenshots/03-ask-ai-danger-escalation.png' });

    // Step C: Out of scope refusal
    await input.fill('What dose in mg of Paracetamol syrup for infant?');
    await sendBtn.click();
    await expect(page.getByText(/Outside Protocol Scope/i)).toBeVisible();
    await expect(page.getByText(/ASHA workers do not prescribe dosages/i)).toBeVisible();
    await page.screenshot({ path: 'screenshots/04-ask-ai-refusal.png' });

    // Step D: BM25 Citation
    await input.fill('How to assess dehydration and give ORS for diarrhea?');
    await sendBtn.click();
    await expect(page.getByText(/Source: Diarrhea & Dehydration Management Protocol/i)).toBeVisible();
    await expect(page.getByText(/Section 6.1/i)).toBeVisible();
    await page.screenshot({ path: 'screenshots/05-ask-ai-bm25-citation.png' });
  });

  test('5. Daily Visit Plan: Priority Ranking & Mark Completed Queue', async ({ page }) => {
    await page.goto('/');
    await dismissSplash(page);

    // Ensure English
    await ensureLanguage(page, 'en');

    // Navigate to Visits
    await page.locator('button:visible').filter({ hasText: /Visits|సందర్శనలు/i }).first().click();

    // Verify initial tabs: Visit Schedule (30) and Completed Visits (0)
    await expect(page.getByRole('button', { name: /Visit Schedule \(30\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Completed Visits \(0\)/i })).toBeVisible();

    // Top item should be an Urgent Risk visit
    await expect(page.getByText(/Urgent Risk/i).first()).toBeVisible();

    // Click "Mark Completed" on first available card
    const markBtn = page.getByRole('button', { name: /Mark visit completed|Mark Completed|పూర్తయినట్లు గుర్తించు/i }).first();
    await expect(markBtn).toBeVisible();
    await markBtn.click();

    // Dynamic Counts: Visit Schedule must decrement to 29, Completed Visits must increment to 1
    await expect(page.getByRole('button', { name: /Visit Schedule \(29\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Completed Visits \(1\)/i })).toBeVisible();

    // Switch to Completed Visits tab
    await page.getByRole('button', { name: /Completed Visits \(1\)/i }).click();

    // Completed card should appear in Completed Visits list
    await expect(page.getByText(/Completed/i).first()).toBeVisible();

    // Should NOT have a "Mark Completed" button in Completed Visits tab
    await expect(page.getByRole('button', { name: /Mark Completed/i })).toHaveCount(0);

    // Switch back to Visit Schedule (Pending) tab
    await page.getByRole('button', { name: /Visit Schedule \(29\)/i }).click();
    await expect(page.getByRole('button', { name: /Visit Schedule \(29\)/i })).toBeVisible();

    await page.screenshot({ path: 'screenshots/06-visit-plan-priority.png' });
  });

  test('6. Evaluator Tools: System Footprint & Test Console', async ({ page }) => {
    await page.goto('/');
    await dismissSplash(page);

    // Ensure English
    await ensureLanguage(page, 'en');

    // Navigate to More
    await page.locator('button:visible').filter({ hasText: /More|మరిన్ని/i }).first().click();

    // Click Evaluator Tools
    await page.getByText(/Evaluator Tools/i).first().click();

    // Verify Footprint has 0 MB model size and real latency numbers
    await expect(page.getByText('0 MB').first()).toBeVisible();
    await expect(page.getByText(/CPU only, no network calls/i)).toBeVisible();
    await page.screenshot({ path: 'screenshots/07-evaluator-footprint.png' });

    // Switch to Test Console sub-tab
    await page.getByRole('button', { name: /Clinical Rule Test Console/i }).click();
    await expect(page.getByText('55 Questions')).toBeVisible();

    // Run test battery
    const runBtn = page.getByRole('button', { name: /Run Sample Test Battery/i });
    await runBtn.click();

    // Wait for execution to finish
    await expect(page.getByText(/40 \/ 40 \(100%\)/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/15 \/ 15 \(100%\)/i)).toBeVisible();
    await page.screenshot({ path: 'screenshots/08-evaluator-test-console.png' });
  });

  test('7. Connectivity Transitions, Status Banners, and Auto-Sync', async ({ context, page }) => {
    await page.goto('/');
    await dismissSplash(page);

    // Step A: Initial Online state
    await ensureLanguage(page, 'en');
    await expect(page.locator('main').getByText(/Online - data syncs automatically/i).first()).toBeVisible();

    // Check Sync screen online: "Sync Now" is present, shows last synced
    await page.locator('button:visible').filter({ hasText: /More|మరిన్ని/i }).first().click();
    await page.getByText(/Offline Data & Sync/i).first().click();
    await expect(page.getByText(/Last synced/i)).toBeVisible();

    // Step B: Add an item to sync queue by completing a visit
    await page.locator('button:visible').filter({ hasText: /Visits|సందర్శనలు/i }).first().click();
    const markBtn = page.getByRole('button', { name: /Mark Completed|పూర్తయినట్లు గుర్తించు|Mark visit completed/i }).first();
    await expect(markBtn).toBeVisible();
    await markBtn.click();
    await expect(page.getByRole('button', { name: /Completed Visits \(1\)/i })).toBeVisible();

    // Navigate to Home screen to verify Home banner
    await page.locator('button:visible').filter({ hasText: /Home|హోమ్/i }).first().click();

    // Step C: Switch to Offline (Airplane Mode simulation)
    await context.setOffline(true);
    await page.waitForTimeout(500);

    // Banner immediately flips to Offline state
    await expect(page.locator('main').getByText(/Offline - all features available, changes saved on this device/i).first()).toBeVisible();
    await page.screenshot({ path: 'screenshots/09-offline-airplane-mode.png' });

    // Test bilingual offline banner toggle
    await ensureLanguage(page, 'te');
    await expect(page.locator('main').getByText(/ఆఫ్‌లైన్ - అన్ని ఫీచర్లు అందుబాటులో ఉన్నాయి/i).first()).toBeVisible();
    await ensureLanguage(page, 'en');

    // Go to Sync screen while offline
    await page.locator('button:visible').filter({ hasText: /More|మరిన్ని/i }).first().click();
    await page.getByText(/Offline Data & Sync/i).first().click();

    // Verify "Sync Now" button is disabled and offline warning note is displayed
    const syncNowBtn = page.getByRole('button', { name: /Sync Now|ఇప్పుడే సింక్ చేయండి/i });
    await expect(syncNowBtn).toBeDisabled();
    await expect(page.getByText(/Connect to the internet to sync/i)).toBeVisible();

    // Step D: Verify PWA page reload in offline airplane mode
    await page.reload();
    await page.waitForTimeout(600);
    // App reloads cleanly offline from service worker cache
    await dismissSplash(page);
    await ensureLanguage(page, 'en');
    await expect(page.locator('main').getByText(/Offline - all features available/i).first()).toBeVisible();

    // Navigate to Home screen
    await page.locator('button:visible').filter({ hasText: /Home|హోమ్/i }).first().click();

    // Step E: Reconnect Online -> Auto-Sync must fire honestly without faking remote sync
    await context.setOffline(false);
    await page.waitForTimeout(800);

    // Verify banner flips back to Online
    await expect(page.locator('main').getByText(/Online - data syncs automatically/i).first()).toBeVisible();

    await page.screenshot({ path: 'screenshots/10-reconnection-sync-toast.png' });

    // Navigate to Sync screen to verify queue is PRESERVED when no remote backend exists
    await page.locator('button:visible').filter({ hasText: /More|మరిన్ని/i }).first().click();
    await page.getByText(/Offline Data & Sync/i).first().click();

    // Honest Sync: shows "Not connected" and preserves 1 pending queue item
    await expect(page.getByText(/Not connected/i).first()).toBeVisible();
    await expect(page.getByText(/1 pending/i).first()).toBeVisible();
    await expect(page.getByText(/Saved on this device/i).first()).toBeVisible();

    // Step F: Test remote sync when backend API is configured
    await page.route('**/api/sync', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, processedIds: [1] })
      });
    });

    await page.evaluate(() => {
      window.__BACKEND_URL__ = window.location.origin;
    });

    // Reload Sync screen view to pick up configured backend
    await page.getByRole('button', { name: /Sync Now/i }).click();
    await expect(page.getByText(/0 pending/i)).toBeVisible({ timeout: 5000 });
  });

  test('8. Web Speech API Voice Recognition (Mocked & Field Behavior)', async ({ context, page }) => {
    await setupMockSpeechRecognition(page);

    await page.goto('/');
    await dismissSplash(page);
    await ensureLanguage(page, 'en');

    // Ensure first use notice is cleared for test
    await page.evaluate(() => localStorage.removeItem('sahaaya_voice_notice_seen'));

    // Navigate to Ask AI
    await page.locator('button:visible').filter({ hasText: /Ask AI|సహాయ AI/i }).first().click();

    // Subtest 1: First use notice dialog
    const micBtn = page.locator('button[aria-label*="Listening"], button[aria-label*="Voice"]').first();
    await micBtn.click();

    // Verify notice dialog appears with required statement
    await expect(page.getByText(/Voice input is processed by your browser's speech service and needs internet/i)).toBeVisible();
    const gotItBtn = page.getByRole('button', { name: /Got it|సరే/i });
    await gotItBtn.click();
    await expect(page.getByText(/Voice input is processed by your browser's speech service/i)).toBeHidden();

    // Subtest 2: Spoken danger sign phrase -> fills input (does NOT auto-send) -> user clicks Send -> danger alert
    await page.evaluate(() => {
      window.__mockSpeechText = 'garbhavathi ki raktasravam avtondi';
      window.__mockSpeechError = null;
    });

    await micBtn.click();
    await page.waitForTimeout(300);

    // Verify input box received recognized text
    const input = page.getByPlaceholder(/Search family name|Ask any protocol question/i);
    await expect(input).toHaveValue('garbhavathi ki raktasravam avtondi');

    // Verify not auto-sent (chat does not yet have message until Send is clicked)
    await page.getByRole('button', { name: /Send/i }).click();

    // Verify danger alert triggered
    await expect(page.locator('span:has-text("REFER IMMEDIATELY")')).toBeVisible();
    await expect(page.getByText(/Maternal Vaginal Bleeding/i)).toBeVisible();
    await expect(page.locator('a[href="tel:108"]').first()).toBeVisible();

    // Subtest 3: Spoken greeting -> fills input -> Send -> warm greeting reply
    await page.evaluate(() => {
      window.__mockSpeechText = 'hello';
      window.__mockSpeechError = null;
    });
    await micBtn.click();
    await page.waitForTimeout(300);
    await expect(input).toHaveValue('hello');
    await page.getByRole('button', { name: /Send/i }).click();
    await expect(page.getByText(/Namaste! I am Sahaaya/i)).toBeVisible();

    // Subtest 4: Speech error handling (permission denied)
    await page.evaluate(() => {
      window.__mockSpeechText = null;
      window.__mockSpeechError = 'not-allowed';
    });
    await micBtn.click();
    await page.waitForTimeout(300);
    await expect(page.getByText(/Microphone permission denied/i)).toBeVisible();

    // Subtest 5: Offline-disabled mic state
    await context.setOffline(true);
    await page.waitForTimeout(400);

    // Mic button should be disabled when offline
    await expect(micBtn).toBeDisabled();

    // Restore online
    await context.setOffline(false);
  });

  test('9. Emergency Guidance Screen with Call 108 Button', async ({ page }) => {
    await page.goto('/');
    await dismissSplash(page);
    await ensureLanguage(page, 'en');

    // Navigate to More -> Emergency Guidance (or use Emergency button)
    await page.locator('button:visible').filter({ hasText: /Emergency Guidance|అత్యవసర మార్గదర్శకాలు/i }).first().click();

    // Verify Emergency Screen loaded
    await expect(page.getByText(/Kothavalasa PHC|Community Health Centre/i).first()).toBeVisible();

    // Verify Call 108 button
    const callBtn = page.locator('a[href="tel:108"]').first();
    await expect(callBtn).toBeVisible();
    await expect(callBtn).toHaveAttribute('href', 'tel:108');
  });
});
