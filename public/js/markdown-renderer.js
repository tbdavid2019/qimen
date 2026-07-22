(function(root, factory) {
    var api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.MarkdownRenderer = api;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function() {
    'use strict';

    function escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderInline(text) {
        var codeSpans = [];
        var output = escapeHtml(text).replace(/`([^`]+)`/g, function(match, code) {
            var token = '§§CODE' + codeSpans.length + '§§';
            codeSpans.push('<code>' + code + '</code>');
            return token;
        });

        output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        output = output.replace(/__([^_]+)__/g, '<strong>$1</strong>');
        output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        output = output.replace(/_([^_]+)_/g, '<em>$1</em>');
        output = output.replace(/§§CODE(\d+)§§/g, function(match, index) {
            return codeSpans[Number(index)] || '';
        });

        return output;
    }

    function splitTableRow(line) {
        var value = String(line || '').trim();
        if (value.indexOf('|') === -1) {
            return null;
        }
        if (value.charAt(0) === '|') {
            value = value.slice(1);
        }
        if (value.charAt(value.length - 1) === '|') {
            value = value.slice(0, -1);
        }
        var cells = value.split('|').map(function(cell) {
            return cell.trim();
        });
        return cells.length >= 2 ? cells : null;
    }

    function parseDelimiterRow(line) {
        var cells = splitTableRow(line);
        if (!cells || !cells.every(function(cell) { return /^:?-{3,}:?$/.test(cell); })) {
            return null;
        }
        return cells.map(function(cell) {
            var left = cell.charAt(0) === ':';
            var right = cell.charAt(cell.length - 1) === ':';
            if (left && right) return 'text-center';
            if (right) return 'text-right';
            if (left) return 'text-left';
            return '';
        });
    }

    function cellTag(tag, content, alignment) {
        var className = alignment ? ' class="' + alignment + '"' : '';
        return '<' + tag + className + '>' + renderInline(content) + '</' + tag + '>';
    }

    function renderTable(lines, startIndex) {
        var headers = splitTableRow(lines[startIndex]);
        var alignments = parseDelimiterRow(lines[startIndex + 1]);
        if (!headers || !alignments || headers.length !== alignments.length) {
            return null;
        }

        var index = startIndex + 2;
        var rows = [];
        while (index < lines.length && lines[index].trim()) {
            var cells = splitTableRow(lines[index]);
            if (!cells) break;
            while (cells.length < headers.length) cells.push('');
            rows.push(cells.slice(0, headers.length));
            index += 1;
        }

        var headHtml = headers.map(function(header, cellIndex) {
            return cellTag('th', header, alignments[cellIndex]);
        }).join('');
        var bodyHtml = rows.map(function(row) {
            return '<tr>' + row.map(function(cell, cellIndex) {
                return cellTag('td', cell, alignments[cellIndex]);
            }).join('') + '</tr>';
        }).join('');

        return {
            nextIndex: index,
            html: '<div class="markdown-table-wrapper"><table><thead><tr>' + headHtml
                + '</tr></thead><tbody>' + bodyHtml + '</tbody></table></div>'
        };
    }

    function renderBlocks(lines) {
        var html = [];
        var index = 0;

        while (index < lines.length) {
            var line = lines[index];
            if (!line.trim()) {
                index += 1;
                continue;
            }

            if (/^\s*```/.test(line)) {
                var code = [];
                index += 1;
                while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
                    code.push(lines[index]);
                    index += 1;
                }
                if (index < lines.length) index += 1;
                html.push('<pre><code>' + escapeHtml(code.join('\n')) + '</code></pre>');
                continue;
            }

            var table = index + 1 < lines.length ? renderTable(lines, index) : null;
            if (table) {
                html.push(table.html);
                index = table.nextIndex;
                continue;
            }

            var heading = line.match(/^(#{1,4})\s+(.*)$/);
            if (heading) {
                var level = heading[1].length;
                html.push('<h' + level + '>' + renderInline(heading[2]) + '</h' + level + '>');
                index += 1;
                continue;
            }

            var unordered = line.match(/^\s*[-*]\s+(.*)$/);
            if (unordered) {
                var unorderedItems = [];
                while (index < lines.length) {
                    var unorderedItem = lines[index].match(/^\s*[-*]\s+(.*)$/);
                    if (!unorderedItem) break;
                    unorderedItems.push('<li>' + renderInline(unorderedItem[1]) + '</li>');
                    index += 1;
                }
                html.push('<ul>' + unorderedItems.join('') + '</ul>');
                continue;
            }

            var ordered = line.match(/^\s*\d+\.\s+(.*)$/);
            if (ordered) {
                var orderedItems = [];
                while (index < lines.length) {
                    var orderedItem = lines[index].match(/^\s*\d+\.\s+(.*)$/);
                    if (!orderedItem) break;
                    orderedItems.push('<li>' + renderInline(orderedItem[1]) + '</li>');
                    index += 1;
                }
                html.push('<ol>' + orderedItems.join('') + '</ol>');
                continue;
            }

            html.push('<p>' + renderInline(line) + '</p>');
            index += 1;
        }

        return html.join('');
    }

    function render(markdown) {
        return renderBlocks(String(markdown || '').split(/\r?\n/));
    }

    return {
        escapeHtml: escapeHtml,
        render: render
    };
}));
