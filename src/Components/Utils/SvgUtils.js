/**
 * Contains several by components commonly used generic and specialized util instances
 * for drawing purposes.
 */
class SvgUtils {
    /**
     * Contains an instance for configuration options and sets up all types of util instances.
     *
     * @param opts {Object} - configuration parameters
     */
    constructor(opts) {
        this.opts = opts;
        this.base = new BaseUtils(this.opts);
        this.group = new GroupUtils(this.opts);
        this.circle = new CircleUtils(this.opts, this.base);
        this.line = new LineUtils(this.opts, this.base);
        this.selector = new SelectorUtils(this.opts, this.base, this.circle, this.line);
        this.text = new TextUtils(this.opts, this.base);
    }
}