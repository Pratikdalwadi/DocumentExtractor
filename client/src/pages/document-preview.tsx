import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { ChevronLeft, ChevronRight, ArrowLeft, Download, Copy, Target, Eye, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Document, ExtractionJob, ExtractionResult, BoundingBox } from "@shared/schema";
import { Viewer } from '@react-pdf-viewer/core';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import DOMPurify from 'dompurify';
import BoundingBoxViewer from "@/components/bounding-box-viewer";
import VisualGroundingInterface from "@/components/visual-grounding-interface";
import PerfectExtractionDashboard from "@/components/perfect-extraction-dashboard";
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';

export default function DocumentPreview() {
  const { documentId } = useParams<{ documentId: string }>();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [activeTab, setActiveTab] = useState<'parse' | 'extract' | 'analyze' | 'bbox' | 'chat'>('parse');
  const [outputFormat, setOutputFormat] = useState<'markdown' | 'json'>('markdown');
  const [highlightedRegion, setHighlightedRegion] = useState<{ id: string; type: string } | null>(null);
  const [documentDimensions, setDocumentDimensions] = useState({ width: 0, height: 0 });
  
  // Create the page navigation plugin
  const pageNavigationPluginInstance = pageNavigationPlugin();
  
  const {
    GoToFirstPage,
    GoToLastPage,
    GoToNextPage,
    GoToPreviousPage,
    CurrentPageLabel,
  } = pageNavigationPluginInstance;

  // Fetch document data
  const { data: documentData } = useQuery({
    queryKey: [`/api/documents/${documentId}`],
    enabled: !!documentId,
  });

  // Fetch extraction jobs for this document
  const { data: jobsData } = useQuery({
    queryKey: [`/api/extraction/document/${documentId}`],
    enabled: !!documentId,
    refetchInterval: 2000,
  });

  const document = (documentData as { document?: Document })?.document;
  const jobs = (jobsData as { jobs?: ExtractionJob[] })?.jobs || [];
  const latestJob = jobs.find(job => job.status === 'completed') || jobs[0];

  // Get document file URL
  const getDocumentUrl = (doc: Document) => {
    return `/api/documents/${doc.id}/file`;
  };

  const handleCopyToClipboard = async () => {
    if (!latestJob?.result) return;
    
    try {
      let textContent = '';
      const result = latestJob.result as ExtractionResult;
      
      if (outputFormat === 'json') {
        textContent = JSON.stringify(result, null, 2);
      } else {
        // Format as markdown
        if (result.tables && result.tables.length > 0) {
          result.tables.forEach((table, index) => {
            if (table.title) {
              textContent += `## ${table.title}\n\n`;
            }
            if (table.data && table.data.length > 0) {
              const headers = Object.keys(table.data[0]);
              textContent += headers.join(' | ') + '\n';
              textContent += headers.map(() => '---').join(' | ') + '\n';
              table.data.forEach((row: any) => {
                textContent += headers.map(header => row[header] || '').join(' | ') + '\n';
              });
              textContent += '\n';
            }
          });
        }
      }
      
      await navigator.clipboard.writeText(textContent);
      toast({
        title: "Copied to clipboard",
        description: "Extraction results copied successfully",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Handle region highlighting for visual grounding
  const handleRegionHighlight = (regionId: string | null, regionType: string) => {
    if (regionId) {
      setHighlightedRegion({ id: regionId, type: regionType });
    } else {
      setHighlightedRegion(null);
    }
  };

  // Handle coordinate clicks for visual grounding
  const handleCoordinateClick = (bbox: BoundingBox) => {
    // Switch to bbox tab to show the region
    setActiveTab('bbox');
    // Set the highlighted region (implementation depends on how you want to link them)
    toast({
      title: "Region Located",
      description: `Coordinates: (${bbox.x.toFixed(3)}, ${bbox.y.toFixed(3)})`,
    });
  };

  // Get document dimensions (you might want to calculate this from the actual document)
  const getDocumentDimensions = () => {
    // For now, using standard dimensions - you could enhance this to get actual dimensions
    return { width: 612, height: 792 }; // Standard letter size in points
  };

  const renderExtractionResults = (result: ExtractionResult) => {
    if (outputFormat === 'json') {
      return (
        <pre className="text-sm font-mono whitespace-pre-wrap text-foreground">
          {JSON.stringify(result, null, 2)}
        </pre>
      );
    }

    // Check if we have enhanced structured content
    if (result.structured_content) {
      // Sanitize the content to prevent XSS attacks
      const sanitizedContent = DOMPurify.sanitize(result.structured_content);
      
      return (
        <div className="space-y-4 text-foreground">
          <div className="flex items-center space-x-2 mb-4">
            <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300 rounded-full">
              Enhanced Structured Analysis
            </span>
          </div>
          
          <div className="bg-muted/10 rounded-lg p-6 border border-border/30">
            <div className="prose prose-sm max-w-none dark:prose-invert text-foreground">
              <ReactMarkdown
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold mt-8 mb-4 text-foreground">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-bold mt-6 mb-3 text-foreground">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold mt-4 mb-2 text-foreground">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm text-foreground leading-relaxed mb-3">{children}</p>
                  ),
                  code: ({ children }) => (
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{children}</code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-muted p-4 rounded text-sm font-mono overflow-x-auto">{children}</pre>
                  ),
                  table: ({ children }) => (
                    <table className="min-w-full border border-border mb-4">{children}</table>
                  ),
                  th: ({ children }) => (
                    <th className="border border-border px-3 py-2 bg-muted font-semibold text-left">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-border px-3 py-2">{children}</td>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-foreground">{children}</em>
                  ),
                }}
              >
                {sanitizedContent}
              </ReactMarkdown>
            </div>
          </div>

          {/* Show metadata */}
          {result.metadata && (
            <div className="mt-6 pt-4 border-t border-border/30">
              <div className="text-xs text-muted-foreground">
                {result.metadata.page_count && `${result.metadata.page_count} page(s)`}
                {result.metadata.word_count && ` • ${result.metadata.word_count} words`}
                {result.metadata.ai_provider && ` • Processed with ${result.metadata.ai_provider}`}
                {result.metadata.processed_at && ` • ${new Date(result.metadata.processed_at).toLocaleString()}`}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Fallback to original enhanced structured content with data-driven layout
    return (
      <div className="space-y-4 text-foreground">
        {result.tables && result.tables.map((table, tableIndex) => (
          <div key={tableIndex} className="space-y-3">
            {/* Data-driven marginalia numbering */}
            {table.title && (
              <div className="flex items-center space-x-2 mb-4">
                <span className="px-3 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                  {tableIndex + 1} - {table.title}
                </span>
              </div>
            )}
            
            {table.data && table.data.length > 0 && (
              <div className="space-y-3">
                {table.data.map((row: any, rowIndex) => (
                  <div key={rowIndex} className="group">
                    {Object.entries(row).map(([key, value]) => {
                      const valueStr = String(value);
                      
                      // Check if this looks like a person's name (contains medical titles)
                      const isPersonName = valueStr.match(/(M\.D\.|PhD|Dr\.|MD|Ph\.D)/i);
                      
                      return (
                        <div key={key} className="space-y-2">
                          {key && (
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">
                              {key}
                            </div>
                          )}
                          
                          {isPersonName ? (
                            // Enhanced person card format for medical professionals
                            <div className="bg-muted/30 dark:bg-muted/20 rounded-lg p-4 border border-border/50">
                              <div className="font-semibold text-base text-foreground mb-1">
                                {valueStr}
                              </div>
                              {valueStr.toLowerCase().includes('dermatopathology') && (
                                <div className="text-sm text-muted-foreground">
                                  Board Certified in Dermatopathology
                                </div>
                              )}
                            </div>
                          ) : (
                            // Regular content display with enhanced styling
                            <div className="py-2">
                              <div className="font-medium text-foreground leading-relaxed">
                                {valueStr}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {table.confidence && (
              <div className="text-xs text-muted-foreground mt-4 pt-2 border-t border-border/30">
                Confidence: {Math.round(table.confidence * 100)}%
              </div>
            )}
          </div>
        ))}
        
        {/* Objects display for smart_image extraction */}
        {result.objects && result.objects.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <span className="px-3 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full">
                Objects Detected
              </span>
            </div>
            
            {result.objects.map((obj, objIndex) => (
              <div key={objIndex} className="bg-muted/20 rounded-lg p-4 border border-border/50">
                <div className="font-semibold text-sm text-foreground mb-2">
                  {obj.label}
                </div>
                {obj.description && (
                  <div className="text-sm text-muted-foreground mb-2">
                    {obj.description}
                  </div>
                )}
                {obj.category && (
                  <div className="text-xs text-muted-foreground">
                    Category: {obj.category} • Confidence: {Math.round(obj.confidence * 100)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Text content display */}
        {result.text && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <span className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                Text Content
              </span>
            </div>
            
            <div className="bg-muted/20 rounded-lg p-4 border border-border/50">
              <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {result.text}
              </div>
            </div>
          </div>
        )}
        
        {result.metadata && (
          <div className="mt-8 pt-4 border-t border-border/30">
            <div className="text-sm text-muted-foreground">
              {result.metadata.page_count && `${result.metadata.page_count} page(s)`}
              {result.metadata.word_count && ` • ${result.metadata.word_count} words`}
              {result.metadata.ai_provider && ` • Processed with ${result.metadata.ai_provider}`}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!document) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Document not found</p>
          <Link href="/">
            <Button variant="outline" className="mt-4" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border" data-testid="preview-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="h-6 border-l border-border"></div>
              <div>
                <h1 className="text-lg font-semibold text-foreground" data-testid="text-document-name">
                  {document.originalName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {document.mimeType} • {Math.round(document.size / 1024)} KB
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(getDocumentUrl(document), '_blank')}
                data-testid="button-download-document"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Panel - Document Viewer */}
        <div className="flex-1 flex flex-col bg-card border-r border-border">
          {/* Navigation Controls */}
          <div className="flex items-center justify-center p-4 border-b border-border bg-muted/50">
            <div className="flex items-center space-x-2">
              <GoToPreviousPage>
                {(props) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={props.onClick}
                    disabled={props.isDisabled}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                )}
              </GoToPreviousPage>
              
              <CurrentPageLabel>
                {(props) => (
                  <span className="text-sm font-medium px-3 py-1 bg-background rounded border">
                    {props.currentPage + 1} / {props.numberOfPages}
                  </span>
                )}
              </CurrentPageLabel>
              
              <GoToNextPage>
                {(props) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={props.onClick}
                    disabled={props.isDisabled}
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </GoToNextPage>
            </div>
          </div>

          {/* Document Display */}
          <div className="flex-1 overflow-auto bg-gray-100 p-4" data-testid="document-viewer">
            {document.mimeType === 'application/pdf' ? (
              <div style={{ height: 'calc(100vh - 12rem)' }}>
                <Viewer
                  fileUrl={getDocumentUrl(document)}
                  plugins={[pageNavigationPluginInstance]}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <img
                  src={getDocumentUrl(document)}
                  alt={document.originalName}
                  className="max-w-full max-h-full object-contain"
                  data-testid="image-document"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Extraction Results */}
        <div className="w-96 flex flex-col bg-background">
          {/* Tab Headers */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full flex flex-col">
            <TabsList className="grid grid-cols-5 m-4 mb-2" data-testid="tabs-main">
              <TabsTrigger value="parse" data-testid="tab-parse">Parse</TabsTrigger>
              <TabsTrigger value="extract" data-testid="tab-extract">Extract</TabsTrigger>
              <TabsTrigger value="analyze" data-testid="tab-analyze">
                <BarChart3 className="w-3 h-3 mr-1" />
                Analyze
              </TabsTrigger>
              <TabsTrigger value="bbox" data-testid="tab-bbox">
                <Target className="w-3 h-3 mr-1" />
                Boxes
              </TabsTrigger>
              <TabsTrigger value="chat" data-testid="tab-chat">Chat</TabsTrigger>
            </TabsList>

            <TabsContent value="parse" className="flex-1 flex flex-col m-0">
              <div className="p-4 space-y-4 flex-1 overflow-auto">
                {/* Format Selection */}
                <div className="flex space-x-2">
                  <Button
                    variant={outputFormat === 'markdown' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOutputFormat('markdown')}
                    data-testid="button-format-markdown"
                  >
                    Markdown
                  </Button>
                  <Button
                    variant={outputFormat === 'json' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOutputFormat('json')}
                    data-testid="button-format-json"
                  >
                    JSON
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyToClipboard}
                    data-testid="button-copy"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                {/* Extraction Results */}
                <Card>
                  <CardContent className="p-4">
                    {latestJob?.status === 'completed' && latestJob.result ? (
                      <div data-testid="extraction-content">
                        {renderExtractionResults(latestJob.result as ExtractionResult)}
                      </div>
                    ) : latestJob?.status === 'processing' ? (
                      <div className="text-center py-8 text-muted-foreground" data-testid="processing-status">
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                        Processing document...
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground" data-testid="no-results">
                        No extraction results available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="extract" className="flex-1 flex flex-col m-0">
              <div className="flex-1 overflow-hidden" data-testid="extract-tab-content">
                {latestJob?.status === 'completed' && latestJob.result ? (
                  <VisualGroundingInterface
                    extractionResult={latestJob.result as ExtractionResult}
                    onRegionHighlight={handleRegionHighlight}
                    highlightedRegion={highlightedRegion}
                    onCoordinateClick={handleCoordinateClick}
                  />
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    {latestJob?.status === 'processing' ? (
                      <div>
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                        Processing document for visual grounding...
                      </div>
                    ) : (
                      "No extraction results available for visual grounding"
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analyze" className="flex-1 flex flex-col m-0">
              <div className="flex-1 overflow-hidden" data-testid="analyze-tab-content">
                {latestJob?.status === 'completed' && latestJob.result ? (
                  <PerfectExtractionDashboard
                    extractionResult={latestJob.result as ExtractionResult}
                    processingTime={latestJob.completedAt && latestJob.createdAt ? 
                      new Date(latestJob.completedAt).getTime() - new Date(latestJob.createdAt).getTime() : 0}
                    documentMetrics={(latestJob.result as ExtractionResult).metadata}
                  />
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    {latestJob?.status === 'processing' ? (
                      <div>
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                        Analyzing document metrics...
                      </div>
                    ) : (
                      "No extraction results available for analysis"
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="bbox" className="flex-1 flex flex-col m-0">
              <div className="flex-1 overflow-hidden" data-testid="bbox-tab-content">
                {latestJob?.status === 'completed' && latestJob.result ? (
                  <BoundingBoxViewer
                    documentUrl={getDocumentUrl(document)}
                    extractionResult={latestJob.result as ExtractionResult}
                    documentWidth={getDocumentDimensions().width}
                    documentHeight={getDocumentDimensions().height}
                    onRegionHover={handleRegionHighlight}
                    onRegionClick={(regionId, regionType) => {
                      setHighlightedRegion({ id: regionId, type: regionType });
                      // Optionally switch to extract tab to show grounding
                      setActiveTab('extract');
                    }}
                    highlightedRegion={highlightedRegion}
                  />
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    {latestJob?.status === 'processing' ? (
                      <div>
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                        Processing bounding box analysis...
                      </div>
                    ) : (
                      "No extraction results available for bounding box visualization"
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="chat" className="flex-1 flex flex-col m-0">
              <div className="p-4 text-center text-muted-foreground" data-testid="chat-tab-content">
                Chat functionality coming soon...
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}