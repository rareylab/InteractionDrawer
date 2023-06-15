class EdgeInfo {
    static oppositeStereo(stereo) {
        const oppositeStereo = {
            'stereoFront': 'stereoBack',
            'stereoFrontReverse': 'stereoBackReverse',
            'stereoBack': 'stereoFront',
            'stereoBackReverse': 'stereoFrontReverse'
        };
        return oppositeStereo[stereo];
    }
}