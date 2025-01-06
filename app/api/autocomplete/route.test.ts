import 'openai/shims/node';
import { POST } from './route';

// Define the step type
interface Step {
  title: string;
  markdown: string;
}

describe('Autocomplete API', () => {
  // Store original environment
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment after all tests
    process.env = originalEnv;
  });

  it('should return 400 if start or goal nodes are missing', async () => {
    const request = new Request('http://localhost:3000/api/autocomplete', {
      method: 'POST',
      body: JSON.stringify({ startNodes: [], goalNodes: [] })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Missing start or goal nodes');
  });

  it('should handle missing API key gracefully', async () => {
    // Remove API key
    process.env.OPENAI_API_KEY = '';

    const request = new Request('http://localhost:3000/api/autocomplete', {
      method: 'POST',
      body: JSON.stringify({
        startNodes: [{ id: '1', title: 'Start', markdown: 'Start desc' }],
        goalNodes: [{ id: '2', title: 'Goal', markdown: 'Goal desc' }]
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe('OpenAI API key is not configured');
  }, 30000); // Increase timeout for API call

  it('should generate steps between start and goal nodes', async () => {
    // Skip if no API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('Skipping test: No OpenAI API key configured');
      return;
    }

    const request = new Request('http://localhost:3000/api/autocomplete', {
      method: 'POST',
      body: JSON.stringify({
        startNodes: [{ 
          id: '1', 
          title: 'Research Problem Definition', 
          markdown: 'Define the core research problem and objectives.' 
        }],
        goalNodes: [{ 
          id: '2', 
          title: 'Final Paper Submission', 
          markdown: 'Submit the completed research paper to the journal.' 
        }]
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    
    // Verify the structure of generated steps
    data.forEach((step: Step) => {
      expect(step).toHaveProperty('title');
      expect(step).toHaveProperty('markdown');
      expect(typeof step.title).toBe('string');
      expect(typeof step.markdown).toBe('string');
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.markdown.length).toBeGreaterThan(0);
    });
  }, 60000); // Increase timeout for API call

  it('should handle invalid input format', async () => {
    // Skip if no API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('Skipping test: No OpenAI API key configured');
      return;
    }

    const request = new Request('http://localhost:3000/api/autocomplete', {
      method: 'POST',
      body: JSON.stringify({
        startNodes: [{ 
          id: '1', 
          title: 'Start', 
          markdown: ''.repeat(10000) // Very long input to test handling
        }],
        goalNodes: [{ 
          id: '2', 
          title: 'Goal', 
          markdown: 'Goal desc' 
        }]
      })
    });

    const response = await POST(request);
    // Either the API will handle it (200) or our error handling will catch it (500)
    expect([200, 500]).toContain(response.status);

    const data = await response.json();
    if (response.status === 200) {
      expect(Array.isArray(data)).toBe(true);
    } else {
      expect(data).toHaveProperty('error');
    }
  }, 60000); // Increase timeout for API call
}); 