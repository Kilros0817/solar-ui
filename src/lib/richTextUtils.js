// Rich Text Import/Export Utilities

/**
 * Export rich text content to a Markdown file
 * @param {string} content - HTML content to export
 * @param {string} filename - Name of the file to save
 */
export function exportRichText(content, filename = 'content') {
  // Convert HTML to Markdown
  const markdownContent = htmlToMarkdown(content);
  
  // Create and download file
  const blob = new Blob([markdownContent], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import rich text content from a Markdown file
 * @param {File} file - File to import
 * @returns {Promise<string>} - HTML content
 */
export function importRichText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target.result;
      
      // Convert Markdown to HTML
      const htmlContent = markdownToHtml(content);
      resolve(htmlContent);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Convert HTML to Markdown (basic conversion)
 * @param {string} html - HTML content
 * @returns {string} - Markdown content
 */
function htmlToMarkdown(html) {
  return html
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
      const items = content.match(/<li[^>]*>(.*?)<\/li>/gi);
      if (items) {
        return items.map(item => `- ${item.replace(/<li[^>]*>(.*?)<\/li>/i, '$1').replace(/<[^>]*>/g, '')}`).join('\n') + '\n';
      }
      return '';
    })
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
      const items = content.match(/<li[^>]*>(.*?)<\/li>/gi);
      if (items) {
        return items.map((item, index) => `${index + 1}. ${item.replace(/<li[^>]*>(.*?)<\/li>/i, '$1').replace(/<[^>]*>/g, '')}`).join('\n') + '\n';
      }
      return '';
    })
    .replace(/<hr[^>]*>/gi, '---\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Convert plain text to HTML
 * @param {string} text - Plain text content
 * @returns {string} - HTML content
 */
function textToHtml(text) {
  return text
    .replace(/\n/g, '<br>')
    .replace(/^(.+)$/gm, '<p>$1</p>')
    .replace(/<p><br><\/p>/g, '');
}

/**
 * Convert Markdown to HTML (basic conversion)
 * @param {string} markdown - Markdown content
 * @returns {string} - HTML content
 */
function markdownToHtml(markdown) {
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/~~(.*?)~~/g, '<s>$1</s>')
    .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
    .replace(/^\d+\. (.*$)/gim, '<ol><li>$1</li></ol>')
    .replace(/^---$/gim, '<hr>')
    .replace(/\n/g, '<br>')
    .replace(/<ul><li>(.*?)<\/li><\/ul>/g, (match, content) => {
      const items = content.split('<br>').filter(item => item.trim());
      return '<ul>' + items.map(item => `<li>${item.trim()}</li>`).join('') + '</ul>';
    })
    .replace(/<ol><li>(.*?)<\/li><\/ol>/g, (match, content) => {
      const items = content.split('<br>').filter(item => item.trim());
      return '<ol>' + items.map(item => `<li>${item.trim()}</li>`).join('') + '</ol>';
    });
}

/**
 * Get supported file types for import/export
 * @returns {Array} - Array of supported file types
 */
export function getSupportedFileTypes() {
  return [
    { extension: 'md', mimeType: 'text/markdown', label: 'Markdown File' }
  ];
}

/**
 * Validate file type for import
 * @param {File} file - File to validate
 * @returns {boolean} - Whether file type is supported
 */
export function isValidFileType(file) {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  return fileExtension === 'md';
}
