import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useTextVisibility } from '@/hooks/use-text-visibility';
import { 
  Eye, 
  Type, 
  Contrast, 
  Accessibility, 
  RotateCcw, 
  Plus, 
  Minus
} from 'lucide-react';

export default function TextVisibilitySettings() {
  const {
    preferences,
    isLoaded,
    toggleHighContrast,
    toggleLargeText,
    toggleEnhancedReadability,
    toggleReducedMotion,
    increaseFontSize,
    decreaseFontSize,
    updatePreference,
    resetPreferences,
    getTextClasses,
  } = useTextVisibility();

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Text Visibility Settings
          </CardTitle>
          <CardDescription>
            Customize text appearance and readability for better visibility.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleHighContrast}
              className={preferences.highContrast ? 'bg-primary text-primary-foreground' : ''}
            >
              <Contrast className="h-4 w-4 mr-2" />
              High Contrast
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLargeText}
              className={preferences.largeText ? 'bg-primary text-primary-foreground' : ''}
            >
              <Type className="h-4 w-4 mr-2" />
              Large Text
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleEnhancedReadability}
              className={preferences.enhancedReadability ? 'bg-primary text-primary-foreground' : ''}
            >
              <Accessibility className="h-4 w-4 mr-2" />
              Enhanced Readability
            </Button>
          </div>

          <Separator />

          {/* Font Size Control */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Type className="h-4 w-4" />
              Font Size
            </Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={decreaseFontSize}
                disabled={preferences.fontSize === 'small'}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <Select
                  value={preferences.fontSize}
                  onValueChange={(value) => updatePreference('fontSize', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (14px)</SelectItem>
                    <SelectItem value="medium">Medium (16px)</SelectItem>
                    <SelectItem value="large">Large (18px)</SelectItem>
                    <SelectItem value="extra-large">Extra Large (20px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={increaseFontSize}
                disabled={preferences.fontSize === 'extra-large'}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Accessibility Options */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Accessibility Options</Label>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="high-contrast">High Contrast Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Increases contrast between text and background
                  </p>
                </div>
                <Switch
                  id="high-contrast"
                  checked={preferences.highContrast}
                  onCheckedChange={toggleHighContrast}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="large-text">Large Text</Label>
                  <p className="text-sm text-muted-foreground">
                    Increases the size of all text elements
                  </p>
                </div>
                <Switch
                  id="large-text"
                  checked={preferences.largeText}
                  onCheckedChange={toggleLargeText}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="enhanced-readability">Enhanced Readability</Label>
                  <p className="text-sm text-muted-foreground">
                    Improves line spacing and letter spacing
                  </p>
                </div>
                <Switch
                  id="enhanced-readability"
                  checked={preferences.enhancedReadability}
                  onCheckedChange={toggleEnhancedReadability}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="reduced-motion">Reduce Motion</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimizes animations and transitions
                  </p>
                </div>
                <Switch
                  id="reduced-motion"
                  checked={preferences.reducedMotion}
                  onCheckedChange={toggleReducedMotion}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Preview Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Preview</Label>
            <Card className="p-4 bg-muted/50">
              <div className={getTextClasses()}>
                <h3 className="text-xl font-semibold mb-2">Sample Heading</h3>
                <p className="mb-3">
                  This is a sample paragraph to demonstrate how your text visibility settings affect readability. 
                  The quick brown fox jumps over the lazy dog.
                </p>
                <div className="flex gap-2 mb-3">
                  <Badge variant="default">Default Badge</Badge>
                  <Badge variant="secondary">Secondary Badge</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  This is smaller text for descriptions or secondary information.
                </p>
              </div>
            </Card>
          </div>

          {/* Reset Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={resetPreferences}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}