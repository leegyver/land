/**
 * YouTube URL에서 비디오 ID를 추출합니다.
 */
export function extractYouTubeId(url: string): string | null {
    const watchRegex = /(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:&.*)?/i;
    const shortUrlRegex = /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?.*)?/i;
    const shortsRegex = /(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?.*)?/i;
    const embedRegex = /(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?.*)?/i;

    const watchMatch = url.match(watchRegex);
    if (watchMatch) return watchMatch[1];

    const shortUrlMatch = url.match(shortUrlRegex);
    if (shortUrlMatch) return shortUrlMatch[1];

    const shortsMatch = url.match(shortsRegex);
    if (shortsMatch) return shortsMatch[1];

    const embedMatch = url.match(embedRegex);
    if (embedMatch) return embedMatch[1];

    return null;
}

/**
 * 텍스트 내의 YouTube URL을 찾아 iframe 임베드 코드로 변환합니다.
 * HTML 태그 내의 URL은 무시하고 순수 텍스트 상태의 URL 또는 a 태그 내의 URL을 처리합니다.
 */
export function parseYouTubeLinks(html: string): string {
    if (!html) return html;

    // 유튜브 임베드 HTML 생성을 위한 헬퍼 함수
    const createEmbed = (videoId: string) => `
        <div class="youtube-embed-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 20px 0; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            <iframe 
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
                src="https://www.youtube.com/embed/${videoId}" 
                title="YouTube video player" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen>
            </iframe>
        </div>`;

    // 1. 이미 a 태그로 감싸진 YouTube 링크 처리
    const linkedRegex = /<a\s+(?:[^>]*?\s+)?href=["']((?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}[^"']*)["'][^>]*>.*?<\/a>/gi;
    
    let processedHtml = html.replace(linkedRegex, (match, url) => {
        const videoId = extractYouTubeId(url);
        if (videoId) {
            return createEmbed(videoId);
        }
        return match;
    });

    // 2. 태그 밖의 텍스트로 존재하는 YouTube 링크 처리
    // 태그 자체(<...>) 또는 유튜브 URL을 찾습니다. 
    // 유튜브 URL 매칭 시 태그 내부를 침범하지 않도록 [^<>\s"']* 를 사용하여 태그 시작 기호(<) 앞에서 멈추게 합니다.
    const tagOrUrlRegex = /(<[^>]+>)|((?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}[^<>\s"']*)/gi;
    
    processedHtml = processedHtml.replace(tagOrUrlRegex, (match, tag, url) => {
        // HTML 태그라면 변환 없이 그대로 반환 (태그 내부의 URL 보호)
        if (tag) return tag;
        
        // 태그 외부의 URL인 경우에만 처리
        if (url) {
            const videoId = extractYouTubeId(url);
            if (videoId) {
                return createEmbed(videoId);
            }
        }
        return match;
    });

    return processedHtml;
}
