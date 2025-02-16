export function safeRedirect(url: string, openInNewTab = false)
{
    const link = document.createElement('a');
    link.href = url;
    if (openInNewTab) link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}