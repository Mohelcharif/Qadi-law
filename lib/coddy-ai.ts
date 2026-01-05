/**
 * Coddy AI Integration Adapter
 *
 * This adapter provides a stub implementation for integrating with Coddy AI.
 * In production, replace the mock responses with actual API calls.
 */

import axios, { AxiosInstance } from 'axios';

export interface AIAnalysisResult {
  summary: string;
  extractedFields: Record<string, any>;
  issues: AIIssue[];
}

export interface AIIssue {
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location?: string;
}

export interface ChatResponse {
  answer: string;
  confidence: number;
}

export interface RFIItem {
  question: string;
  context: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

class CoddyAI {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.CODDY_API_KEY || 'demo-key';
    this.client = axios.create({
      baseURL: process.env.CODDY_API_BASE_URL || 'https://api.coddy.ai',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Analyze a document and extract issues, summary, and structured data
   */
  async analyzeDocument(
    fileUrl: string,
    context: {
      requirementName: string;
      requirementDescription?: string;
      category: string;
    }
  ): Promise<AIAnalysisResult> {
    try {
      // TODO: Replace with actual API call
      // const response = await this.client.post('/analyze', {
      //   fileUrl,
      //   context,
      // });
      // return response.data;

      // STUB: Return mock analysis
      return this.mockAnalyze(context);
    } catch (error) {
      console.error('Coddy AI analysis failed:', error);
      throw new Error('Failed to analyze document');
    }
  }

  /**
   * Chat with AI about a specific document requirement
   */
  async chatOnDocument(
    requirementId: string,
    question: string,
    documentContext?: any
  ): Promise<ChatResponse> {
    try {
      // TODO: Replace with actual API call
      // const response = await this.client.post('/chat', {
      //   requirementId,
      //   question,
      //   documentContext,
      // });
      // return response.data;

      // STUB: Return mock response
      return {
        answer: `Based on the documents provided, ${question.toLowerCase().includes('compliant') ? 'the submission appears to align with DFSA requirements, but please verify specific clauses.' : 'I would recommend consulting with your compliance officer for detailed guidance.'}`,
        confidence: 0.75,
      };
    } catch (error) {
      console.error('Coddy AI chat failed:', error);
      throw new Error('Failed to get AI response');
    }
  }

  /**
   * Generate RFI (Request for Information) items for a requirement
   */
  async generateRFI(
    requirementId: string,
    currentSubmissions?: any[]
  ): Promise<RFIItem[]> {
    try {
      // TODO: Replace with actual API call
      // const response = await this.client.post('/rfi/generate', {
      //   requirementId,
      //   currentSubmissions,
      // });
      // return response.data;

      // STUB: Return mock RFIs
      return [
        {
          question: 'Please provide clarification on the AML risk assessment methodology',
          context: 'Section 3.2 of the submitted document references a "proprietary scoring model" but does not detail the specific risk factors considered.',
          priority: 'HIGH',
        },
        {
          question: 'Confirm the frequency of transaction monitoring reviews',
          context: 'The document states "regular reviews" without specifying the cadence (daily, weekly, monthly).',
          priority: 'MEDIUM',
        },
      ];
    } catch (error) {
      console.error('Coddy AI RFI generation failed:', error);
      throw new Error('Failed to generate RFI');
    }
  }

  /**
   * Mock analysis for demo purposes
   */
  private mockAnalyze(context: { requirementName: string; category: string }): AIAnalysisResult {
    const severities: Array<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = ['LOW', 'MEDIUM', 'HIGH'];
    const randomSeverity = severities[Math.floor(Math.random() * severities.length)];

    return {
      summary: `Document uploaded for "${context.requirementName}". The submission appears complete but requires review for DFSA compliance. Key sections identified: governance structure, operational procedures, and risk management framework.`,
      extractedFields: {
        documentType: context.category,
        pageCount: Math.floor(Math.random() * 50) + 10,
        lastUpdated: new Date().toISOString(),
        containsFinancialData: Math.random() > 0.5,
        language: 'en',
      },
      issues: [
        {
          title: 'Missing DFSA-required disclosure',
          description: `The document should explicitly reference DFSA ${context.category.replace('_', ' ')} requirements. Consider adding a compliance statement in the executive summary.`,
          severity: randomSeverity,
          location: 'Page 1, Section 1.2',
        },
        {
          title: 'Incomplete risk scenario analysis',
          description: 'The risk assessment section would benefit from additional stress testing scenarios specific to crypto/token operations.',
          severity: 'MEDIUM',
          location: 'Page 8, Section 3.4',
        },
      ],
    };
  }
}

// Singleton instance
export const coddyAI = new CoddyAI();
