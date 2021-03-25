(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(_dereq_,module,exports){
/*
 Copyright 2011-2013 Abdulla Abdurakhmanov
 Original sources are available at https://code.google.com/p/x2js/

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/*
  Further modified for dashjs to:
  - keep track of children nodes in order in attribute __children.
  - add type conversion matchers
  - re-add ignoreRoot
  - allow zero-length attributePrefix
  - don't add white-space text nodes
  - remove explicit RequireJS support
*/

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
function X2JS(config) {
    'use strict';

    var VERSION = "1.2.0";

    config = config || {};
    initConfigDefaults();
    initRequiredPolyfills();

    function initConfigDefaults() {
        if (config.escapeMode === undefined) {
            config.escapeMode = true;
        }

        if (config.attributePrefix === undefined) {
            config.attributePrefix = "_";
        }

        config.arrayAccessForm = config.arrayAccessForm || "none";
        config.emptyNodeForm = config.emptyNodeForm || "text";

        if (config.enableToStringFunc === undefined) {
            config.enableToStringFunc = true;
        }
        config.arrayAccessFormPaths = config.arrayAccessFormPaths || [];
        if (config.skipEmptyTextNodesForObj === undefined) {
            config.skipEmptyTextNodesForObj = true;
        }
        if (config.stripWhitespaces === undefined) {
            config.stripWhitespaces = true;
        }
        config.datetimeAccessFormPaths = config.datetimeAccessFormPaths || [];

        if (config.useDoubleQuotes === undefined) {
            config.useDoubleQuotes = false;
        }

        config.xmlElementsFilter = config.xmlElementsFilter || [];
        config.jsonPropertiesFilter = config.jsonPropertiesFilter || [];

        if (config.keepCData === undefined) {
            config.keepCData = false;
        }

        if (config.ignoreRoot === undefined) {
            config.ignoreRoot = false;
        }
    }

    var DOMNodeTypes = {
        ELEMENT_NODE: 1,
        TEXT_NODE: 3,
        CDATA_SECTION_NODE: 4,
        COMMENT_NODE: 8,
        DOCUMENT_NODE: 9
    };

    function initRequiredPolyfills() {}

    function getNodeLocalName(node) {
        var nodeLocalName = node.localName;
        if (nodeLocalName == null) // Yeah, this is IE!!
            nodeLocalName = node.baseName;
        if (nodeLocalName == null || nodeLocalName == "") // =="" is IE too
            nodeLocalName = node.nodeName;
        return nodeLocalName;
    }

    function getNodePrefix(node) {
        return node.prefix;
    }

    function escapeXmlChars(str) {
        if (typeof str == "string") return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');else return str;
    }

    function unescapeXmlChars(str) {
        return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
    }

    function checkInStdFiltersArrayForm(stdFiltersArrayForm, obj, name, path) {
        var idx = 0;
        for (; idx < stdFiltersArrayForm.length; idx++) {
            var filterPath = stdFiltersArrayForm[idx];
            if (typeof filterPath === "string") {
                if (filterPath == path) break;
            } else if (filterPath instanceof RegExp) {
                if (filterPath.test(path)) break;
            } else if (typeof filterPath === "function") {
                if (filterPath(obj, name, path)) break;
            }
        }
        return idx != stdFiltersArrayForm.length;
    }

    function toArrayAccessForm(obj, childName, path) {
        switch (config.arrayAccessForm) {
            case "property":
                if (!(obj[childName] instanceof Array)) obj[childName + "_asArray"] = [obj[childName]];else obj[childName + "_asArray"] = obj[childName];
                break;
            /*case "none":
                break;*/
        }

        if (!(obj[childName] instanceof Array) && config.arrayAccessFormPaths.length > 0) {
            if (checkInStdFiltersArrayForm(config.arrayAccessFormPaths, obj, childName, path)) {
                obj[childName] = [obj[childName]];
            }
        }
    }

    function fromXmlDateTime(prop) {
        // Implementation based up on http://stackoverflow.com/questions/8178598/xml-datetime-to-javascript-date-object
        // Improved to support full spec and optional parts
        var bits = prop.split(/[-T:+Z]/g);

        var d = new Date(bits[0], bits[1] - 1, bits[2]);
        var secondBits = bits[5].split("\.");
        d.setHours(bits[3], bits[4], secondBits[0]);
        if (secondBits.length > 1) d.setMilliseconds(secondBits[1]);

        // Get supplied time zone offset in minutes
        if (bits[6] && bits[7]) {
            var offsetMinutes = bits[6] * 60 + Number(bits[7]);
            var sign = /\d\d-\d\d:\d\d$/.test(prop) ? '-' : '+';

            // Apply the sign
            offsetMinutes = 0 + (sign == '-' ? -1 * offsetMinutes : offsetMinutes);

            // Apply offset and local timezone
            d.setMinutes(d.getMinutes() - offsetMinutes - d.getTimezoneOffset());
        } else if (prop.indexOf("Z", prop.length - 1) !== -1) {
            d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()));
        }

        // d is now a local time equivalent to the supplied time
        return d;
    }

    function checkFromXmlDateTimePaths(value, childName, fullPath) {
        if (config.datetimeAccessFormPaths.length > 0) {
            var path = fullPath.split("\.#")[0];
            if (checkInStdFiltersArrayForm(config.datetimeAccessFormPaths, value, childName, path)) {
                return fromXmlDateTime(value);
            } else return value;
        } else return value;
    }

    function checkXmlElementsFilter(obj, childType, childName, childPath) {
        if (childType == DOMNodeTypes.ELEMENT_NODE && config.xmlElementsFilter.length > 0) {
            return checkInStdFiltersArrayForm(config.xmlElementsFilter, obj, childName, childPath);
        } else return true;
    }

    function parseDOMChildren(node, path) {
        if (node.nodeType == DOMNodeTypes.DOCUMENT_NODE) {
            var result = new Object();
            var nodeChildren = node.childNodes;
            // Alternative for firstElementChild which is not supported in some environments
            for (var cidx = 0; cidx < nodeChildren.length; cidx++) {
                var child = nodeChildren[cidx];
                if (child.nodeType == DOMNodeTypes.ELEMENT_NODE) {
                    if (config.ignoreRoot) {
                        result = parseDOMChildren(child);
                    } else {
                        result = {};
                        var childName = getNodeLocalName(child);
                        result[childName] = parseDOMChildren(child);
                    }
                }
            }
            return result;
        } else if (node.nodeType == DOMNodeTypes.ELEMENT_NODE) {
            var result = new Object();
            result.__cnt = 0;

            var children = [];
            var nodeChildren = node.childNodes;

            // Children nodes
            for (var cidx = 0; cidx < nodeChildren.length; cidx++) {
                var child = nodeChildren[cidx];
                var childName = getNodeLocalName(child);

                if (child.nodeType != DOMNodeTypes.COMMENT_NODE) {
                    var childPath = path + "." + childName;
                    if (checkXmlElementsFilter(result, child.nodeType, childName, childPath)) {
                        result.__cnt++;
                        if (result[childName] == null) {
                            var c = parseDOMChildren(child, childPath);
                            if (childName != "#text" || /[^\s]/.test(c)) {
                                var o = {};
                                o[childName] = c;
                                children.push(o);
                            }
                            result[childName] = c;
                            toArrayAccessForm(result, childName, childPath);
                        } else {
                            if (result[childName] != null) {
                                if (!(result[childName] instanceof Array)) {
                                    result[childName] = [result[childName]];
                                    toArrayAccessForm(result, childName, childPath);
                                }
                            }

                            var c = parseDOMChildren(child, childPath);
                            if (childName != "#text" || /[^\s]/.test(c)) {
                                // Don't add white-space text nodes
                                var o = {};
                                o[childName] = c;
                                children.push(o);
                            }
                            result[childName][result[childName].length] = c;
                        }
                    }
                }
            }

            result.__children = children;

            // Attributes
            var nodeLocalName = getNodeLocalName(node);
            for (var aidx = 0; aidx < node.attributes.length; aidx++) {
                var attr = node.attributes[aidx];
                result.__cnt++;

                var value2 = attr.value;
                for (var m = 0, ml = config.matchers.length; m < ml; m++) {
                    var matchobj = config.matchers[m];
                    if (matchobj.test(attr, nodeLocalName)) value2 = matchobj.converter(attr.value);
                }

                result[config.attributePrefix + attr.name] = value2;
            }

            // Node namespace prefix
            var nodePrefix = getNodePrefix(node);
            if (nodePrefix != null && nodePrefix != "") {
                result.__cnt++;
                result.__prefix = nodePrefix;
            }

            if (result["#text"] != null) {
                result.__text = result["#text"];
                if (result.__text instanceof Array) {
                    result.__text = result.__text.join("\n");
                }
                //if(config.escapeMode)
                //	result.__text = unescapeXmlChars(result.__text);
                if (config.stripWhitespaces) result.__text = result.__text.trim();
                delete result["#text"];
                if (config.arrayAccessForm == "property") delete result["#text_asArray"];
                result.__text = checkFromXmlDateTimePaths(result.__text, childName, path + "." + childName);
            }
            if (result["#cdata-section"] != null) {
                result.__cdata = result["#cdata-section"];
                delete result["#cdata-section"];
                if (config.arrayAccessForm == "property") delete result["#cdata-section_asArray"];
            }

            if (result.__cnt == 0 && config.emptyNodeForm == "text") {
                result = '';
            } else if (result.__cnt == 1 && result.__text != null) {
                result = result.__text;
            } else if (result.__cnt == 1 && result.__cdata != null && !config.keepCData) {
                result = result.__cdata;
            } else if (result.__cnt > 1 && result.__text != null && config.skipEmptyTextNodesForObj) {
                if (config.stripWhitespaces && result.__text == "" || result.__text.trim() == "") {
                    delete result.__text;
                }
            }
            delete result.__cnt;

            if (config.enableToStringFunc && (result.__text != null || result.__cdata != null)) {
                result.toString = function () {
                    return (this.__text != null ? this.__text : '') + (this.__cdata != null ? this.__cdata : '');
                };
            }

            return result;
        } else if (node.nodeType == DOMNodeTypes.TEXT_NODE || node.nodeType == DOMNodeTypes.CDATA_SECTION_NODE) {
            return node.nodeValue;
        }
    }

    function startTag(jsonObj, element, attrList, closed) {
        var resultStr = "<" + (jsonObj != null && jsonObj.__prefix != null ? jsonObj.__prefix + ":" : "") + element;
        if (attrList != null) {
            for (var aidx = 0; aidx < attrList.length; aidx++) {
                var attrName = attrList[aidx];
                var attrVal = jsonObj[attrName];
                if (config.escapeMode) attrVal = escapeXmlChars(attrVal);
                resultStr += " " + attrName.substr(config.attributePrefix.length) + "=";
                if (config.useDoubleQuotes) resultStr += '"' + attrVal + '"';else resultStr += "'" + attrVal + "'";
            }
        }
        if (!closed) resultStr += ">";else resultStr += "/>";
        return resultStr;
    }

    function endTag(jsonObj, elementName) {
        return "</" + (jsonObj.__prefix != null ? jsonObj.__prefix + ":" : "") + elementName + ">";
    }

    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    function jsonXmlSpecialElem(jsonObj, jsonObjField) {
        if (config.arrayAccessForm == "property" && endsWith(jsonObjField.toString(), "_asArray") || jsonObjField.toString().indexOf(config.attributePrefix) == 0 || jsonObjField.toString().indexOf("__") == 0 || jsonObj[jsonObjField] instanceof Function) return true;else return false;
    }

    function jsonXmlElemCount(jsonObj) {
        var elementsCnt = 0;
        if (jsonObj instanceof Object) {
            for (var it in jsonObj) {
                if (jsonXmlSpecialElem(jsonObj, it)) continue;
                elementsCnt++;
            }
        }
        return elementsCnt;
    }

    function checkJsonObjPropertiesFilter(jsonObj, propertyName, jsonObjPath) {
        return config.jsonPropertiesFilter.length == 0 || jsonObjPath == "" || checkInStdFiltersArrayForm(config.jsonPropertiesFilter, jsonObj, propertyName, jsonObjPath);
    }

    function parseJSONAttributes(jsonObj) {
        var attrList = [];
        if (jsonObj instanceof Object) {
            for (var ait in jsonObj) {
                if (ait.toString().indexOf("__") == -1 && ait.toString().indexOf(config.attributePrefix) == 0) {
                    attrList.push(ait);
                }
            }
        }
        return attrList;
    }

    function parseJSONTextAttrs(jsonTxtObj) {
        var result = "";

        if (jsonTxtObj.__cdata != null) {
            result += "<![CDATA[" + jsonTxtObj.__cdata + "]]>";
        }

        if (jsonTxtObj.__text != null) {
            if (config.escapeMode) result += escapeXmlChars(jsonTxtObj.__text);else result += jsonTxtObj.__text;
        }
        return result;
    }

    function parseJSONTextObject(jsonTxtObj) {
        var result = "";

        if (jsonTxtObj instanceof Object) {
            result += parseJSONTextAttrs(jsonTxtObj);
        } else if (jsonTxtObj != null) {
            if (config.escapeMode) result += escapeXmlChars(jsonTxtObj);else result += jsonTxtObj;
        }

        return result;
    }

    function getJsonPropertyPath(jsonObjPath, jsonPropName) {
        if (jsonObjPath === "") {
            return jsonPropName;
        } else return jsonObjPath + "." + jsonPropName;
    }

    function parseJSONArray(jsonArrRoot, jsonArrObj, attrList, jsonObjPath) {
        var result = "";
        if (jsonArrRoot.length == 0) {
            result += startTag(jsonArrRoot, jsonArrObj, attrList, true);
        } else {
            for (var arIdx = 0; arIdx < jsonArrRoot.length; arIdx++) {
                result += startTag(jsonArrRoot[arIdx], jsonArrObj, parseJSONAttributes(jsonArrRoot[arIdx]), false);
                result += parseJSONObject(jsonArrRoot[arIdx], getJsonPropertyPath(jsonObjPath, jsonArrObj));
                result += endTag(jsonArrRoot[arIdx], jsonArrObj);
            }
        }
        return result;
    }

    function parseJSONObject(jsonObj, jsonObjPath) {
        var result = "";

        var elementsCnt = jsonXmlElemCount(jsonObj);

        if (elementsCnt > 0) {
            for (var it in jsonObj) {

                if (jsonXmlSpecialElem(jsonObj, it) || jsonObjPath != "" && !checkJsonObjPropertiesFilter(jsonObj, it, getJsonPropertyPath(jsonObjPath, it))) continue;

                var subObj = jsonObj[it];

                var attrList = parseJSONAttributes(subObj);

                if (subObj == null || subObj == undefined) {
                    result += startTag(subObj, it, attrList, true);
                } else if (subObj instanceof Object) {

                    if (subObj instanceof Array) {
                        result += parseJSONArray(subObj, it, attrList, jsonObjPath);
                    } else if (subObj instanceof Date) {
                        result += startTag(subObj, it, attrList, false);
                        result += subObj.toISOString();
                        result += endTag(subObj, it);
                    } else {
                        var subObjElementsCnt = jsonXmlElemCount(subObj);
                        if (subObjElementsCnt > 0 || subObj.__text != null || subObj.__cdata != null) {
                            result += startTag(subObj, it, attrList, false);
                            result += parseJSONObject(subObj, getJsonPropertyPath(jsonObjPath, it));
                            result += endTag(subObj, it);
                        } else {
                            result += startTag(subObj, it, attrList, true);
                        }
                    }
                } else {
                    result += startTag(subObj, it, attrList, false);
                    result += parseJSONTextObject(subObj);
                    result += endTag(subObj, it);
                }
            }
        }
        result += parseJSONTextObject(jsonObj);

        return result;
    }

    this.parseXmlString = function (xmlDocStr) {
        var isIEParser = window.ActiveXObject || "ActiveXObject" in window;
        if (xmlDocStr === undefined) {
            return null;
        }
        var xmlDoc;
        if (window.DOMParser) {
            var parser = new window.DOMParser();
            var parsererrorNS = null;
            try {
                xmlDoc = parser.parseFromString(xmlDocStr, "text/xml");
                if (xmlDoc.getElementsByTagNameNS("*", "parsererror").length > 0) {
                    xmlDoc = null;
                }
            } catch (err) {
                xmlDoc = null;
            }
        } else {
            // IE :(
            if (xmlDocStr.indexOf("<?") == 0) {
                xmlDocStr = xmlDocStr.substr(xmlDocStr.indexOf("?>") + 2);
            }
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = "false";
            xmlDoc.loadXML(xmlDocStr);
        }
        return xmlDoc;
    };

    this.asArray = function (prop) {
        if (prop === undefined || prop == null) return [];else if (prop instanceof Array) return prop;else return [prop];
    };

    this.toXmlDateTime = function (dt) {
        if (dt instanceof Date) return dt.toISOString();else if (typeof dt === 'number') return new Date(dt).toISOString();else return null;
    };

    this.asDateTime = function (prop) {
        if (typeof prop == "string") {
            return fromXmlDateTime(prop);
        } else return prop;
    };

    this.xml2json = function (xmlDoc) {
        return parseDOMChildren(xmlDoc);
    };

    this.xml_str2json = function (xmlDocStr) {
        var xmlDoc = this.parseXmlString(xmlDocStr);
        if (xmlDoc != null) return this.xml2json(xmlDoc);else return null;
    };

    this.json2xml_str = function (jsonObj) {
        return parseJSONObject(jsonObj, "");
    };

    this.json2xml = function (jsonObj) {
        var xmlDocStr = this.json2xml_str(jsonObj);
        return this.parseXmlString(xmlDocStr);
    };

    this.getVersion = function () {
        return VERSION;
    };
}

exports["default"] = X2JS;
module.exports = exports["default"];

},{}],2:[function(_dereq_,module,exports){
/*! codem-isoboxer v0.3.6 https://github.com/madebyhiro/codem-isoboxer/blob/master/LICENSE.txt */
var ISOBoxer = {};

ISOBoxer.parseBuffer = function(arrayBuffer) {
  return new ISOFile(arrayBuffer).parse();
};

ISOBoxer.addBoxProcessor = function(type, parser) {
  if (typeof type !== 'string' || typeof parser !== 'function') {
    return;
  }
  ISOBox.prototype._boxProcessors[type] = parser;
};

ISOBoxer.createFile = function() {
  return new ISOFile();
};

// See ISOBoxer.append() for 'pos' parameter syntax
ISOBoxer.createBox = function(type, parent, pos) {
  var newBox = ISOBox.create(type);
  if (parent) {
    parent.append(newBox, pos);
  }
  return newBox;
};

// See ISOBoxer.append() for 'pos' parameter syntax
ISOBoxer.createFullBox = function(type, parent, pos) {
  var newBox = ISOBoxer.createBox(type, parent, pos);
  newBox.version = 0;
  newBox.flags = 0;
  return newBox;
};

ISOBoxer.Utils = {};
ISOBoxer.Utils.dataViewToString = function(dataView, encoding) {
  var impliedEncoding = encoding || 'utf-8';
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder(impliedEncoding).decode(dataView);
  }
  var a = [];
  var i = 0;

  if (impliedEncoding === 'utf-8') {
    /* The following algorithm is essentially a rewrite of the UTF8.decode at
    http://bannister.us/weblog/2007/simple-base64-encodedecode-javascript/
    */

    while (i < dataView.byteLength) {
      var c = dataView.getUint8(i++);
      if (c < 0x80) {
        // 1-byte character (7 bits)
      } else if (c < 0xe0) {
        // 2-byte character (11 bits)
        c = (c & 0x1f) << 6;
        c |= (dataView.getUint8(i++) & 0x3f);
      } else if (c < 0xf0) {
        // 3-byte character (16 bits)
        c = (c & 0xf) << 12;
        c |= (dataView.getUint8(i++) & 0x3f) << 6;
        c |= (dataView.getUint8(i++) & 0x3f);
      } else {
        // 4-byte character (21 bits)
        c = (c & 0x7) << 18;
        c |= (dataView.getUint8(i++) & 0x3f) << 12;
        c |= (dataView.getUint8(i++) & 0x3f) << 6;
        c |= (dataView.getUint8(i++) & 0x3f);
      }
      a.push(String.fromCharCode(c));
    }
  } else { // Just map byte-by-byte (probably wrong)
    while (i < dataView.byteLength) {
      a.push(String.fromCharCode(dataView.getUint8(i++)));
    }
  }
  return a.join('');
};

ISOBoxer.Utils.utf8ToByteArray = function(string) {
  // Only UTF-8 encoding is supported by TextEncoder
  var u, i;
  if (typeof TextEncoder !== 'undefined') {
    u = new TextEncoder().encode(string);
  } else {
    u = [];
    for (i = 0; i < string.length; ++i) {
      var c = string.charCodeAt(i);
      if (c < 0x80) {
        u.push(c);
      } else if (c < 0x800) {
        u.push(0xC0 | (c >> 6));
        u.push(0x80 | (63 & c));
      } else if (c < 0x10000) {
        u.push(0xE0 | (c >> 12));
        u.push(0x80 | (63 & (c >> 6)));
        u.push(0x80 | (63 & c));
      } else {
        u.push(0xF0 | (c >> 18));
        u.push(0x80 | (63 & (c >> 12)));
        u.push(0x80 | (63 & (c >> 6)));
        u.push(0x80 | (63 & c));
      }
    }
  }
  return u;
};

// Method to append a box in the list of child boxes
// The 'pos' parameter can be either:
//   - (number) a position index at which to insert the new box
//   - (string) the type of the box after which to insert the new box
//   - (object) the box after which to insert the new box
ISOBoxer.Utils.appendBox = function(parent, box, pos) {
  box._offset = parent._cursor.offset;
  box._root = (parent._root ? parent._root : parent);
  box._raw = parent._raw;
  box._parent = parent;

  if (pos === -1) {
    // The new box is a sub-box of the parent but not added in boxes array,
    // for example when the new box is set as an entry (see dref and stsd for example)
    return;
  }

  if (pos === undefined || pos === null) {
    parent.boxes.push(box);
    return;
  }

  var index = -1,
      type;

  if (typeof pos === "number") {
    index = pos;
  } else {
    if (typeof pos === "string") {
      type = pos;
    } else if (typeof pos === "object" && pos.type) {
      type = pos.type;
    } else {
      parent.boxes.push(box);
      return;
    }

    for (var i = 0; i < parent.boxes.length; i++) {
      if (type === parent.boxes[i].type) {
        index = i + 1;
        break;
      }
    }
  }
  parent.boxes.splice(index, 0, box);
};

if (typeof exports !== 'undefined') {
  exports.parseBuffer     = ISOBoxer.parseBuffer;
  exports.addBoxProcessor = ISOBoxer.addBoxProcessor;
  exports.createFile      = ISOBoxer.createFile;
  exports.createBox       = ISOBoxer.createBox;
  exports.createFullBox   = ISOBoxer.createFullBox;
  exports.Utils           = ISOBoxer.Utils;
}

ISOBoxer.Cursor = function(initialOffset) {
  this.offset = (typeof initialOffset == 'undefined' ? 0 : initialOffset);
};

var ISOFile = function(arrayBuffer) {
  this._cursor = new ISOBoxer.Cursor();
  this.boxes = [];
  if (arrayBuffer) {
    this._raw = new DataView(arrayBuffer);
  }
};

ISOFile.prototype.fetch = function(type) {
  var result = this.fetchAll(type, true);
  return (result.length ? result[0] : null);
};

ISOFile.prototype.fetchAll = function(type, returnEarly) {
  var result = [];
  ISOFile._sweep.call(this, type, result, returnEarly);
  return result;
};

ISOFile.prototype.parse = function() {
  this._cursor.offset = 0;
  this.boxes = [];
  while (this._cursor.offset < this._raw.byteLength) {
    var box = ISOBox.parse(this);

    // Box could not be parsed
    if (typeof box.type === 'undefined') break;

    this.boxes.push(box);
  }
  return this;
};

ISOFile._sweep = function(type, result, returnEarly) {
  if (this.type && this.type == type) result.push(this);
  for (var box in this.boxes) {
    if (result.length && returnEarly) return;
    ISOFile._sweep.call(this.boxes[box], type, result, returnEarly);
  }
};

ISOFile.prototype.write = function() {

  var length = 0,
      i;

  for (i = 0; i < this.boxes.length; i++) {
    length += this.boxes[i].getLength(false);
  }

  var bytes = new Uint8Array(length);
  this._rawo = new DataView(bytes.buffer);
  this.bytes = bytes;
  this._cursor.offset = 0;

  for (i = 0; i < this.boxes.length; i++) {
    this.boxes[i].write();
  }

  return bytes.buffer;
};

ISOFile.prototype.append = function(box, pos) {
  ISOBoxer.Utils.appendBox(this, box, pos);
};
var ISOBox = function() {
  this._cursor = new ISOBoxer.Cursor();
};

ISOBox.parse = function(parent) {
  var newBox = new ISOBox();
  newBox._offset = parent._cursor.offset;
  newBox._root = (parent._root ? parent._root : parent);
  newBox._raw = parent._raw;
  newBox._parent = parent;
  newBox._parseBox();
  parent._cursor.offset = newBox._raw.byteOffset + newBox._raw.byteLength;
  return newBox;
};

ISOBox.create = function(type) {
  var newBox = new ISOBox();
  newBox.type = type;
  newBox.boxes = [];
  return newBox;
};

ISOBox.prototype._boxContainers = ['dinf', 'edts', 'mdia', 'meco', 'mfra', 'minf', 'moof', 'moov', 'mvex', 'stbl', 'strk', 'traf', 'trak', 'tref', 'udta', 'vttc', 'sinf', 'schi', 'encv', 'enca'];

ISOBox.prototype._boxProcessors = {};

///////////////////////////////////////////////////////////////////////////////////////////////////
// Generic read/write functions

ISOBox.prototype._procField = function (name, type, size) {
  if (this._parsing) {
    this[name] = this._readField(type, size);
  }
  else {
    this._writeField(type, size, this[name]);
  }
};

ISOBox.prototype._procFieldArray = function (name, length, type, size) {
  var i;
  if (this._parsing) {
    this[name] = [];
    for (i = 0; i < length; i++) {
      this[name][i] = this._readField(type, size);
    }
  }
  else {
    for (i = 0; i < this[name].length; i++) {
      this._writeField(type, size, this[name][i]);
    }
  }
};

ISOBox.prototype._procFullBox = function() {
  this._procField('version', 'uint', 8);
  this._procField('flags', 'uint', 24);
};

ISOBox.prototype._procEntries = function(name, length, fn) {
  var i;
  if (this._parsing) {
    this[name] = [];
    for (i = 0; i < length; i++) {
      this[name].push({});
      fn.call(this, this[name][i]);
    }
  }
  else {
    for (i = 0; i < length; i++) {
      fn.call(this, this[name][i]);
    }
  }
};

ISOBox.prototype._procSubEntries = function(entry, name, length, fn) {
  var i;
  if (this._parsing) {
    entry[name] = [];
    for (i = 0; i < length; i++) {
      entry[name].push({});
      fn.call(this, entry[name][i]);
    }
  }
  else {
    for (i = 0; i < length; i++) {
      fn.call(this, entry[name][i]);
    }
  }
};

ISOBox.prototype._procEntryField = function (entry, name, type, size) {
  if (this._parsing) {
    entry[name] = this._readField(type, size);
  }
  else {
    this._writeField(type, size, entry[name]);
  }
};

ISOBox.prototype._procSubBoxes = function(name, length) {
  var i;
  if (this._parsing) {
    this[name] = [];
    for (i = 0; i < length; i++) {
      this[name].push(ISOBox.parse(this));
    }
  }
  else {
    for (i = 0; i < length; i++) {
      if (this._rawo) {
        this[name][i].write();
      } else {
        this.size += this[name][i].getLength();
      }
    }
  }
};

///////////////////////////////////////////////////////////////////////////////////////////////////
// Read/parse functions

ISOBox.prototype._readField = function(type, size) {
  switch (type) {
    case 'uint':
      return this._readUint(size);
    case 'int':
      return this._readInt(size);
    case 'template':
      return this._readTemplate(size);
    case 'string':
      return (size === -1) ? this._readTerminatedString() : this._readString(size);
    case 'data':
      return this._readData(size);
    case 'utf8':
      return this._readUTF8String();
    default:
      return -1;
  }
};

ISOBox.prototype._readInt = function(size) {
  var result = null,
      offset = this._cursor.offset - this._raw.byteOffset;
  switch(size) {
  case 8:
    result = this._raw.getInt8(offset);
    break;
  case 16:
    result = this._raw.getInt16(offset);
    break;
  case 32:
    result = this._raw.getInt32(offset);
    break;
  case 64:
    // Warning: JavaScript cannot handle 64-bit integers natively.
    // This will give unexpected results for integers >= 2^53
    var s1 = this._raw.getInt32(offset);
    var s2 = this._raw.getInt32(offset + 4);
    result = (s1 * Math.pow(2,32)) + s2;
    break;
  }
  this._cursor.offset += (size >> 3);
  return result;
};

ISOBox.prototype._readUint = function(size) {
  var result = null,
      offset = this._cursor.offset - this._raw.byteOffset,
      s1, s2;
  switch(size) {
  case 8:
    result = this._raw.getUint8(offset);
    break;
  case 16:
    result = this._raw.getUint16(offset);
    break;
  case 24:
    s1 = this._raw.getUint16(offset);
    s2 = this._raw.getUint8(offset + 2);
    result = (s1 << 8) + s2;
    break;
  case 32:
    result = this._raw.getUint32(offset);
    break;
  case 64:
    // Warning: JavaScript cannot handle 64-bit integers natively.
    // This will give unexpected results for integers >= 2^53
    s1 = this._raw.getUint32(offset);
    s2 = this._raw.getUint32(offset + 4);
    result = (s1 * Math.pow(2,32)) + s2;
    break;
  }
  this._cursor.offset += (size >> 3);
  return result;
};

ISOBox.prototype._readString = function(length) {
  var str = '';
  for (var c = 0; c < length; c++) {
    var char = this._readUint(8);
    str += String.fromCharCode(char);
  }
  return str;
};

ISOBox.prototype._readTemplate = function(size) {
  var pre = this._readUint(size / 2);
  var post = this._readUint(size / 2);
  return pre + (post / Math.pow(2, size / 2));
};

ISOBox.prototype._readTerminatedString = function() {
  var str = '';
  while (this._cursor.offset - this._offset < this._raw.byteLength) {
    var char = this._readUint(8);
    if (char === 0) break;
    str += String.fromCharCode(char);
  }
  return str;
};

ISOBox.prototype._readData = function(size) {
  var length = (size > 0) ? size : (this._raw.byteLength - (this._cursor.offset - this._offset));
  if (length > 0) {
    var data = new Uint8Array(this._raw.buffer, this._cursor.offset, length);

    this._cursor.offset += length;
    return data;
  }
  else {
    return null;
  }
};

ISOBox.prototype._readUTF8String = function() {
  var length = this._raw.byteLength - (this._cursor.offset - this._offset);
  var data = null;
  if (length > 0) {
    data = new DataView(this._raw.buffer, this._cursor.offset, length);
    this._cursor.offset += length;
  }
 
  return data ? ISOBoxer.Utils.dataViewToString(data) : data;
};

ISOBox.prototype._parseBox = function() {
  this._parsing = true;
  this._cursor.offset = this._offset;

  // return immediately if there are not enough bytes to read the header
  if (this._offset + 8 > this._raw.buffer.byteLength) {
    this._root._incomplete = true;
    return;
  }

  this._procField('size', 'uint', 32);
  this._procField('type', 'string', 4);

  if (this.size === 1)      { this._procField('largesize', 'uint', 64); }
  if (this.type === 'uuid') { this._procFieldArray('usertype', 16, 'uint', 8); }

  switch(this.size) {
  case 0:
    this._raw = new DataView(this._raw.buffer, this._offset, (this._raw.byteLength - this._cursor.offset + 8));
    break;
  case 1:
    if (this._offset + this.size > this._raw.buffer.byteLength) {
      this._incomplete = true;
      this._root._incomplete = true;
    } else {
      this._raw = new DataView(this._raw.buffer, this._offset, this.largesize);
    }
    break;
  default:
    if (this._offset + this.size > this._raw.buffer.byteLength) {
      this._incomplete = true;
      this._root._incomplete = true;
    } else {
      this._raw = new DataView(this._raw.buffer, this._offset, this.size);
    }
  }

  // additional parsing
  if (!this._incomplete) {
    if (this._boxProcessors[this.type]) {
      this._boxProcessors[this.type].call(this);
    }
    if (this._boxContainers.indexOf(this.type) !== -1) {
      this._parseContainerBox();
    } else{
      // Unknown box => read and store box content
      this._data = this._readData();
    }
  }
};

ISOBox.prototype._parseFullBox = function() {
  this.version = this._readUint(8);
  this.flags = this._readUint(24);
};

ISOBox.prototype._parseContainerBox = function() {
  this.boxes = [];
  while (this._cursor.offset - this._raw.byteOffset < this._raw.byteLength) {
    this.boxes.push(ISOBox.parse(this));
  }
};

///////////////////////////////////////////////////////////////////////////////////////////////////
// Write functions

ISOBox.prototype.append = function(box, pos) {
  ISOBoxer.Utils.appendBox(this, box, pos);
};

ISOBox.prototype.getLength = function() {
  this._parsing = false;
  this._rawo = null;

  this.size = 0;
  this._procField('size', 'uint', 32);
  this._procField('type', 'string', 4);

  if (this.size === 1)      { this._procField('largesize', 'uint', 64); }
  if (this.type === 'uuid') { this._procFieldArray('usertype', 16, 'uint', 8); }

  if (this._boxProcessors[this.type]) {
    this._boxProcessors[this.type].call(this);
  }

  if (this._boxContainers.indexOf(this.type) !== -1) {
    for (var i = 0; i < this.boxes.length; i++) {
      this.size += this.boxes[i].getLength();
    }
  } 

  if (this._data) {
    this._writeData(this._data);
  }

  return this.size;
};

ISOBox.prototype.write = function() {
  this._parsing = false;
  this._cursor.offset = this._parent._cursor.offset;

  switch(this.size) {
  case 0:
    this._rawo = new DataView(this._parent._rawo.buffer, this._cursor.offset, (this.parent._rawo.byteLength - this._cursor.offset));
    break;
  case 1:
      this._rawo = new DataView(this._parent._rawo.buffer, this._cursor.offset, this.largesize);
    break;
  default:
      this._rawo = new DataView(this._parent._rawo.buffer, this._cursor.offset, this.size);
  }

  this._procField('size', 'uint', 32);
  this._procField('type', 'string', 4);

  if (this.size === 1)      { this._procField('largesize', 'uint', 64); }
  if (this.type === 'uuid') { this._procFieldArray('usertype', 16, 'uint', 8); }

  if (this._boxProcessors[this.type]) {
    this._boxProcessors[this.type].call(this);
  }

  if (this._boxContainers.indexOf(this.type) !== -1) {
    for (var i = 0; i < this.boxes.length; i++) {
      this.boxes[i].write();
    }
  } 

  if (this._data) {
    this._writeData(this._data);
  }

  this._parent._cursor.offset += this.size;

  return this.size;
};

ISOBox.prototype._writeInt = function(size, value) {
  if (this._rawo) {
    var offset = this._cursor.offset - this._rawo.byteOffset;
    switch(size) {
    case 8:
      this._rawo.setInt8(offset, value);
      break;
    case 16:
      this._rawo.setInt16(offset, value);
      break;
    case 32:
      this._rawo.setInt32(offset, value);
      break;
    case 64:
      // Warning: JavaScript cannot handle 64-bit integers natively.
      // This will give unexpected results for integers >= 2^53
      var s1 = Math.floor(value / Math.pow(2,32));
      var s2 = value - (s1 * Math.pow(2,32));
      this._rawo.setUint32(offset, s1);
      this._rawo.setUint32(offset + 4, s2);
      break;
    }
    this._cursor.offset += (size >> 3);
  } else {
    this.size += (size >> 3);
  }
};

ISOBox.prototype._writeUint = function(size, value) {

  if (this._rawo) {
    var offset = this._cursor.offset - this._rawo.byteOffset,
        s1, s2;
    switch(size) {
    case 8:
      this._rawo.setUint8(offset, value);
      break;
    case 16:
      this._rawo.setUint16(offset, value);
      break;
    case 24:
      s1 = (value & 0xFFFF00) >> 8;
      s2 = (value & 0x0000FF);
      this._rawo.setUint16(offset, s1);
      this._rawo.setUint8(offset + 2, s2);
      break;
    case 32:
      this._rawo.setUint32(offset, value);
      break;
    case 64:
      // Warning: JavaScript cannot handle 64-bit integers natively.
      // This will give unexpected results for integers >= 2^53
      s1 = Math.floor(value / Math.pow(2,32));
      s2 = value - (s1 * Math.pow(2,32));
      this._rawo.setUint32(offset, s1);
      this._rawo.setUint32(offset + 4, s2);
      break;
    }
    this._cursor.offset += (size >> 3);
  } else {
    this.size += (size >> 3);
  }
};

ISOBox.prototype._writeString = function(size, str) {
  for (var c = 0; c < size; c++) {
    this._writeUint(8, str.charCodeAt(c));
  }
};

ISOBox.prototype._writeTerminatedString = function(str) {
  if (str.length === 0) {
    return;
  }
  for (var c = 0; c < str.length; c++) {
    this._writeUint(8, str.charCodeAt(c));
  }
  this._writeUint(8, 0);
};

ISOBox.prototype._writeTemplate = function(size, value) {
  var pre = Math.floor(value);
  var post = (value - pre) * Math.pow(2, size / 2);
  this._writeUint(size / 2, pre);
  this._writeUint(size / 2, post);
};

ISOBox.prototype._writeData = function(data) {
  var i;
  //data to copy
  if (data) {
    if (this._rawo) {
      //Array and Uint8Array has also to be managed
      if (data instanceof Array) {
        var offset = this._cursor.offset - this._rawo.byteOffset;
        for (var i = 0; i < data.length; i++) {
          this._rawo.setInt8(offset + i, data[i]);
        }
        this._cursor.offset += data.length;
      } 

      if (data instanceof Uint8Array) {
        this._root.bytes.set(data, this._cursor.offset);
        this._cursor.offset += data.length;
      }

    } else {
      //nothing to copy only size to compute
      this.size += data.length;
    }
  }
};

ISOBox.prototype._writeUTF8String = function(string) {
  var u = ISOBoxer.Utils.utf8ToByteArray(string);
  if (this._rawo) {
    var dataView = new DataView(this._rawo.buffer, this._cursor.offset, u.length);
    for (var i = 0; i < u.length; i++) {
      dataView.setUint8(i, u[i]);
    }
  } else {
    this.size += u.length;
  }
};

ISOBox.prototype._writeField = function(type, size, value) {
  switch (type) {
  case 'uint':
    this._writeUint(size, value);
    break;
  case 'int':
    this._writeInt(size, value);
    break;
  case 'template':
    this._writeTemplate(size, value);
    break;
  case 'string':
      if (size == -1) {
        this._writeTerminatedString(value);
      } else {
        this._writeString(size, value);
      }
      break;
  case 'data':
    this._writeData(value);
    break;
  case 'utf8':
    this._writeUTF8String(value);
    break;
  default:
    break;
  }
};

// ISO/IEC 14496-15:2014 - avc1 box
ISOBox.prototype._boxProcessors['avc1'] = ISOBox.prototype._boxProcessors['encv'] = function() {
  // SampleEntry fields
  this._procFieldArray('reserved1', 6,    'uint', 8);
  this._procField('data_reference_index', 'uint', 16);
  // VisualSampleEntry fields
  this._procField('pre_defined1',         'uint',     16);
  this._procField('reserved2',            'uint',     16);
  this._procFieldArray('pre_defined2', 3, 'uint',     32);
  this._procField('width',                'uint',     16);
  this._procField('height',               'uint',     16);
  this._procField('horizresolution',      'template', 32);
  this._procField('vertresolution',       'template', 32);
  this._procField('reserved3',            'uint',     32);
  this._procField('frame_count',          'uint',     16);
  this._procFieldArray('compressorname', 32,'uint',    8);
  this._procField('depth',                'uint',     16);
  this._procField('pre_defined3',         'int',      16);
  // AVCSampleEntry fields
  this._procField('config', 'data', -1);
};

// ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
ISOBox.prototype._boxProcessors['dref'] = function() {
  this._procFullBox();
  this._procField('entry_count', 'uint', 32);
  this._procSubBoxes('entries', this.entry_count);
};

// ISO/IEC 14496-12:2012 - 8.6.6 Edit List Box
ISOBox.prototype._boxProcessors['elst'] = function() {
  this._procFullBox();
  this._procField('entry_count', 'uint', 32);
  this._procEntries('entries', this.entry_count, function(entry) {
    this._procEntryField(entry, 'segment_duration',     'uint', (this.version === 1) ? 64 : 32);
    this._procEntryField(entry, 'media_time',           'int',  (this.version === 1) ? 64 : 32);
    this._procEntryField(entry, 'media_rate_integer',   'int',  16);
    this._procEntryField(entry, 'media_rate_fraction',  'int',  16);
  });
};

// ISO/IEC 23009-1:2014 - 5.10.3.3 Event Message Box
ISOBox.prototype._boxProcessors['emsg'] = function() {
  this._procFullBox();
  if (this.version == 1) {
    this._procField('timescale',                'uint',   32);
    this._procField('presentation_time',        'uint',   64);
    this._procField('event_duration',           'uint',   32);
    this._procField('id',                       'uint',   32);
    this._procField('scheme_id_uri',            'string', -1);
    this._procField('value',                    'string', -1);
  } else {
    this._procField('scheme_id_uri',            'string', -1);
    this._procField('value',                    'string', -1);
    this._procField('timescale',                'uint',   32);
    this._procField('presentation_time_delta',  'uint',   32);
    this._procField('event_duration',           'uint',   32);
    this._procField('id',                       'uint',   32);
  }
  this._procField('message_data',             'data',   -1);
};
// ISO/IEC 14496-12:2012 - 8.1.2 Free Space Box
ISOBox.prototype._boxProcessors['free'] = ISOBox.prototype._boxProcessors['skip'] = function() {
  this._procField('data', 'data', -1);
};

// ISO/IEC 14496-12:2012 - 8.12.2 Original Format Box
ISOBox.prototype._boxProcessors['frma'] = function() {
  this._procField('data_format', 'uint', 32);
};
// ISO/IEC 14496-12:2012 - 4.3 File Type Box / 8.16.2 Segment Type Box
ISOBox.prototype._boxProcessors['ftyp'] =
ISOBox.prototype._boxProcessors['styp'] = function() {
  this._procField('major_brand', 'string', 4);
  this._procField('minor_version', 'uint', 32);
  var nbCompatibleBrands = -1;
  if (this._parsing) {
    nbCompatibleBrands = (this._raw.byteLength - (this._cursor.offset - this._raw.byteOffset)) / 4;
  }
  this._procFieldArray('compatible_brands', nbCompatibleBrands, 'string', 4);
};

// ISO/IEC 14496-12:2012 - 8.4.3 Handler Reference Box
ISOBox.prototype._boxProcessors['hdlr'] = function() {
  this._procFullBox();
  this._procField('pre_defined',      'uint',   32);
  this._procField('handler_type',     'string', 4);
  this._procFieldArray('reserved', 3, 'uint', 32);
  this._procField('name',             'string', -1);
};

// ISO/IEC 14496-12:2012 - 8.1.1 Media Data Box
ISOBox.prototype._boxProcessors['mdat'] = function() {
  this._procField('data', 'data', -1);
};

// ISO/IEC 14496-12:2012 - 8.4.2 Media Header Box
ISOBox.prototype._boxProcessors['mdhd'] = function() {
  this._procFullBox();
  this._procField('creation_time',      'uint', (this.version == 1) ? 64 : 32);
  this._procField('modification_time',  'uint', (this.version == 1) ? 64 : 32);
  this._procField('timescale',          'uint', 32);
  this._procField('duration',           'uint', (this.version == 1) ? 64 : 32);
  if (!this._parsing && typeof this.language === 'string') {
    // In case of writing and language has been set as a string, then convert it into char codes array
    this.language = ((this.language.charCodeAt(0) - 0x60) << 10) |
                    ((this.language.charCodeAt(1) - 0x60) << 5) |
                    ((this.language.charCodeAt(2) - 0x60));
  }
  this._procField('language',           'uint', 16);
  if (this._parsing) {
    this.language = String.fromCharCode(((this.language >> 10) & 0x1F) + 0x60,
                                        ((this.language >> 5) & 0x1F) + 0x60,
                                        (this.language & 0x1F) + 0x60);
  }
  this._procField('pre_defined',        'uint', 16);
};

// ISO/IEC 14496-12:2012 - 8.8.2 Movie Extends Header Box
ISOBox.prototype._boxProcessors['mehd'] = function() {
  this._procFullBox();
  this._procField('fragment_duration', 'uint', (this.version == 1) ? 64 : 32);
};

// ISO/IEC 14496-12:2012 - 8.8.5 Movie Fragment Header Box
ISOBox.prototype._boxProcessors['mfhd'] = function() {
  this._procFullBox();
  this._procField('sequence_number', 'uint', 32);
};

// ISO/IEC 14496-12:2012 - 8.8.11 Movie Fragment Random Access Box
ISOBox.prototype._boxProcessors['mfro'] = function() {
  this._procFullBox();
  this._procField('mfra_size', 'uint', 32); // Called mfra_size to distinguish from the normal "size" attribute of a box
};


// ISO/IEC 14496-12:2012 - 8.5.2.2 mp4a box (use AudioSampleEntry definition and naming)
ISOBox.prototype._boxProcessors['mp4a'] = ISOBox.prototype._boxProcessors['enca'] = function() {
  // SampleEntry fields
  this._procFieldArray('reserved1', 6,    'uint', 8);
  this._procField('data_reference_index', 'uint', 16);
  // AudioSampleEntry fields
  this._procFieldArray('reserved2', 2,    'uint', 32);
  this._procField('channelcount',         'uint', 16);
  this._procField('samplesize',           'uint', 16);
  this._procField('pre_defined',          'uint', 16);
  this._procField('reserved3',            'uint', 16);
  this._procField('samplerate',           'template', 32);
  // ESDescriptor fields
  this._procField('esds',                 'data', -1);
};

// ISO/IEC 14496-12:2012 - 8.2.2 Movie Header Box
ISOBox.prototype._boxProcessors['mvhd'] = function() {
  this._procFullBox();
  this._procField('creation_time',      'uint',     (this.version == 1) ? 64 : 32);
  this._procField('modification_time',  'uint',     (this.version == 1) ? 64 : 32);
  this._procField('timescale',          'uint',     32);
  this._procField('duration',           'uint',     (this.version == 1) ? 64 : 32);
  this._procField('rate',               'template', 32);
  this._procField('volume',             'template', 16);
  this._procField('reserved1',          'uint',  16);
  this._procFieldArray('reserved2', 2,  'uint',     32);
  this._procFieldArray('matrix', 9,     'template', 32);
  this._procFieldArray('pre_defined', 6,'uint',   32);
  this._procField('next_track_ID',      'uint',     32);
};

// ISO/IEC 14496-30:2014 - WebVTT Cue Payload Box.
ISOBox.prototype._boxProcessors['payl'] = function() {
  this._procField('cue_text', 'utf8');
};

//ISO/IEC 23001-7:2011 - 8.1 Protection System Specific Header Box
ISOBox.prototype._boxProcessors['pssh'] = function() {
  this._procFullBox();
  
  this._procFieldArray('SystemID', 16, 'uint', 8);
  this._procField('DataSize', 'uint', 32);
  this._procFieldArray('Data', this.DataSize, 'uint', 8);
};
// ISO/IEC 14496-12:2012 - 8.12.5 Scheme Type Box
ISOBox.prototype._boxProcessors['schm'] = function() {
    this._procFullBox();
    
    this._procField('scheme_type', 'uint', 32);
    this._procField('scheme_version', 'uint', 32);

    if (this.flags & 0x000001) {
        this._procField('scheme_uri', 'string', -1);
    }
};
// ISO/IEC 14496-12:2012 - 8.6.4.1 sdtp box 
ISOBox.prototype._boxProcessors['sdtp'] = function() {
  this._procFullBox();

  var sample_count = -1;
  if (this._parsing) {
    sample_count = (this._raw.byteLength - (this._cursor.offset - this._raw.byteOffset));
  }

  this._procFieldArray('sample_dependency_table', sample_count, 'uint', 8);
};

// ISO/IEC 14496-12:2012 - 8.16.3 Segment Index Box
ISOBox.prototype._boxProcessors['sidx'] = function() {
  this._procFullBox();
  this._procField('reference_ID', 'uint', 32);
  this._procField('timescale', 'uint', 32);
  this._procField('earliest_presentation_time', 'uint', (this.version == 1) ? 64 : 32);
  this._procField('first_offset', 'uint', (this.version == 1) ? 64 : 32);
  this._procField('reserved', 'uint', 16);
  this._procField('reference_count', 'uint', 16);
  this._procEntries('references', this.reference_count, function(entry) {
    if (!this._parsing) {
      entry.reference  = (entry.reference_type  & 0x00000001) << 31;
      entry.reference |= (entry.referenced_size & 0x7FFFFFFF);
      entry.sap  = (entry.starts_with_SAP & 0x00000001) << 31;
      entry.sap |= (entry.SAP_type        & 0x00000003) << 28;
      entry.sap |= (entry.SAP_delta_time  & 0x0FFFFFFF);
    }
    this._procEntryField(entry, 'reference', 'uint', 32);
    this._procEntryField(entry, 'subsegment_duration', 'uint', 32);
    this._procEntryField(entry, 'sap', 'uint', 32);
    if (this._parsing) {
      entry.reference_type = (entry.reference >> 31) & 0x00000001;
      entry.referenced_size = entry.reference & 0x7FFFFFFF;
      entry.starts_with_SAP  = (entry.sap >> 31) & 0x00000001;
      entry.SAP_type = (entry.sap >> 28) & 0x00000007;
      entry.SAP_delta_time = (entry.sap  & 0x0FFFFFFF);
    }
  });
};

// ISO/IEC 14496-12:2012 - 8.4.5.3 Sound Media Header Box
ISOBox.prototype._boxProcessors['smhd'] = function() {
  this._procFullBox();
  this._procField('balance',  'uint', 16);
  this._procField('reserved', 'uint', 16);
};

// ISO/IEC 14496-12:2012 - 8.16.4 Subsegment Index Box
ISOBox.prototype._boxProcessors['ssix'] = function() {
  this._procFullBox();
  this._procField('subsegment_count', 'uint', 32);
  this._procEntries('subsegments', this.subsegment_count, function(subsegment) {
    this._procEntryField(subsegment, 'ranges_count', 'uint', 32);
    this._procSubEntries(subsegment, 'ranges', subsegment.ranges_count, function(range) {
      this._procEntryField(range, 'level', 'uint', 8);
      this._procEntryField(range, 'range_size', 'uint', 24);
    });
  });
};

// ISO/IEC 14496-12:2012 - 8.5.2 Sample Description Box
ISOBox.prototype._boxProcessors['stsd'] = function() {
  this._procFullBox();
  this._procField('entry_count', 'uint', 32);
  this._procSubBoxes('entries', this.entry_count);
};

// ISO/IEC 14496-12:2015 - 8.7.7 Sub-Sample Information Box
ISOBox.prototype._boxProcessors['subs'] = function () {
  this._procFullBox();
  this._procField('entry_count', 'uint', 32);
  this._procEntries('entries', this.entry_count, function(entry) {
    this._procEntryField(entry, 'sample_delta', 'uint', 32);
    this._procEntryField(entry, 'subsample_count', 'uint', 16);
    this._procSubEntries(entry, 'subsamples', entry.subsample_count, function(subsample) {
      this._procEntryField(subsample, 'subsample_size', 'uint', (this.version === 1) ? 32 : 16);
      this._procEntryField(subsample, 'subsample_priority', 'uint', 8);
      this._procEntryField(subsample, 'discardable', 'uint', 8);
      this._procEntryField(subsample, 'codec_specific_parameters', 'uint', 32);
    });
  });
};

//ISO/IEC 23001-7:2011 - 8.2 Track Encryption Box
ISOBox.prototype._boxProcessors['tenc'] = function() {
    this._procFullBox();

    this._procField('default_IsEncrypted', 'uint', 24);
    this._procField('default_IV_size', 'uint', 8);
    this._procFieldArray('default_KID', 16,    'uint', 8);
 };

// ISO/IEC 14496-12:2012 - 8.8.12 Track Fragmnent Decode Time
ISOBox.prototype._boxProcessors['tfdt'] = function() {
  this._procFullBox();
  this._procField('baseMediaDecodeTime', 'uint', (this.version == 1) ? 64 : 32);
};

// ISO/IEC 14496-12:2012 - 8.8.7 Track Fragment Header Box
ISOBox.prototype._boxProcessors['tfhd'] = function() {
  this._procFullBox();
  this._procField('track_ID', 'uint', 32);
  if (this.flags & 0x01) this._procField('base_data_offset',          'uint', 64);
  if (this.flags & 0x02) this._procField('sample_description_offset', 'uint', 32);
  if (this.flags & 0x08) this._procField('default_sample_duration',   'uint', 32);
  if (this.flags & 0x10) this._procField('default_sample_size',       'uint', 32);
  if (this.flags & 0x20) this._procField('default_sample_flags',      'uint', 32);
};

// ISO/IEC 14496-12:2012 - 8.8.10 Track Fragment Random Access Box
ISOBox.prototype._boxProcessors['tfra'] = function() {
  this._procFullBox();
  this._procField('track_ID', 'uint', 32);
  if (!this._parsing) {
    this.reserved = 0;
    this.reserved |= (this.length_size_of_traf_num  & 0x00000030) << 4;
    this.reserved |= (this.length_size_of_trun_num  & 0x0000000C) << 2;
    this.reserved |= (this.length_size_of_sample_num  & 0x00000003);
  }
  this._procField('reserved', 'uint', 32);
  if (this._parsing) {
    this.length_size_of_traf_num = (this.reserved & 0x00000030) >> 4;
    this.length_size_of_trun_num = (this.reserved & 0x0000000C) >> 2;
    this.length_size_of_sample_num = (this.reserved & 0x00000003);
  }
  this._procField('number_of_entry', 'uint', 32);
  this._procEntries('entries', this.number_of_entry, function(entry) {
    this._procEntryField(entry, 'time', 'uint', (this.version === 1) ? 64 : 32);
    this._procEntryField(entry, 'moof_offset', 'uint', (this.version === 1) ? 64 : 32);
    this._procEntryField(entry, 'traf_number', 'uint', (this.length_size_of_traf_num + 1) * 8);
    this._procEntryField(entry, 'trun_number', 'uint', (this.length_size_of_trun_num + 1) * 8);
    this._procEntryField(entry, 'sample_number', 'uint', (this.length_size_of_sample_num + 1) * 8);
  });
};

// ISO/IEC 14496-12:2012 - 8.3.2 Track Header Box
ISOBox.prototype._boxProcessors['tkhd'] = function() {
  this._procFullBox();
  this._procField('creation_time',      'uint',     (this.version == 1) ? 64 : 32);
  this._procField('modification_time',  'uint',     (this.version == 1) ? 64 : 32);
  this._procField('track_ID',           'uint',     32);
  this._procField('reserved1',          'uint',     32);
  this._procField('duration',           'uint',     (this.version == 1) ? 64 : 32);
  this._procFieldArray('reserved2', 2,  'uint',     32);
  this._procField('layer',              'uint',     16);
  this._procField('alternate_group',    'uint',     16);
  this._procField('volume',             'template', 16);
  this._procField('reserved3',          'uint',     16);
  this._procFieldArray('matrix', 9,     'template', 32);
  this._procField('width',              'template', 32);
  this._procField('height',             'template', 32);
};

// ISO/IEC 14496-12:2012 - 8.8.3 Track Extends Box
ISOBox.prototype._boxProcessors['trex'] = function() {
  this._procFullBox();
  this._procField('track_ID',                         'uint', 32);
  this._procField('default_sample_description_index', 'uint', 32);
  this._procField('default_sample_duration',          'uint', 32);
  this._procField('default_sample_size',              'uint', 32);
  this._procField('default_sample_flags',             'uint', 32);
};

// ISO/IEC 14496-12:2012 - 8.8.8 Track Run Box
// Note: the 'trun' box has a direct relation to the 'tfhd' box for defaults.
// These defaults are not set explicitly here, but are left to resolve for the user.
ISOBox.prototype._boxProcessors['trun'] = function() {
  this._procFullBox();
  this._procField('sample_count', 'uint', 32);
  if (this.flags & 0x1) this._procField('data_offset', 'int', 32);
  if (this.flags & 0x4) this._procField('first_sample_flags', 'uint', 32);
  this._procEntries('samples', this.sample_count, function(sample) {
    if (this.flags & 0x100) this._procEntryField(sample, 'sample_duration', 'uint', 32);
    if (this.flags & 0x200) this._procEntryField(sample, 'sample_size', 'uint', 32);
    if (this.flags & 0x400) this._procEntryField(sample, 'sample_flags', 'uint', 32);
    if (this.flags & 0x800) this._procEntryField(sample, 'sample_composition_time_offset', (this.version === 1) ? 'int' : 'uint',  32);
  });
};

// ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
ISOBox.prototype._boxProcessors['url '] = ISOBox.prototype._boxProcessors['urn '] = function() {
  this._procFullBox();
  if (this.type === 'urn ') {
    this._procField('name', 'string', -1);
  }
  this._procField('location', 'string', -1);
};

// ISO/IEC 14496-30:2014 - WebVTT Source Label Box
ISOBox.prototype._boxProcessors['vlab'] = function() {
  this._procField('source_label', 'utf8');
};

// ISO/IEC 14496-12:2012 - 8.4.5.2 Video Media Header Box
ISOBox.prototype._boxProcessors['vmhd'] = function() {
  this._procFullBox();
  this._procField('graphicsmode', 'uint', 16);
  this._procFieldArray('opcolor', 3, 'uint', 16);
};

// ISO/IEC 14496-30:2014 - WebVTT Configuration Box
ISOBox.prototype._boxProcessors['vttC'] = function() {
  this._procField('config', 'utf8');
};

// ISO/IEC 14496-30:2014 - WebVTT Empty Sample Box
ISOBox.prototype._boxProcessors['vtte'] = function() {
  // Nothing should happen here.
};

},{}],3:[function(_dereq_,module,exports){
'use strict';

var isArray = Array.isArray;
var keyList = Object.keys;
var hasProp = Object.prototype.hasOwnProperty;

module.exports = function equal(a, b) {
  if (a === b) return true;

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    var arrA = isArray(a)
      , arrB = isArray(b)
      , i
      , length
      , key;

    if (arrA && arrB) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;)
        if (!equal(a[i], b[i])) return false;
      return true;
    }

    if (arrA != arrB) return false;

    var dateA = a instanceof Date
      , dateB = b instanceof Date;
    if (dateA != dateB) return false;
    if (dateA && dateB) return a.getTime() == b.getTime();

    var regexpA = a instanceof RegExp
      , regexpB = b instanceof RegExp;
    if (regexpA != regexpB) return false;
    if (regexpA && regexpB) return a.toString() == b.toString();

    var keys = keyList(a);
    length = keys.length;

    if (length !== keyList(b).length)
      return false;

    for (i = length; i-- !== 0;)
      if (!hasProp.call(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      key = keys[i];
      if (!equal(a[key], b[key])) return false;
    }

    return true;
  }

  return a!==a && b!==b;
};

},{}],4:[function(_dereq_,module,exports){
module.exports = {
  XmlEntities: _dereq_(7),
  Html4Entities: _dereq_(5),
  Html5Entities: _dereq_(6),
  AllHtmlEntities: _dereq_(6)
};

},{"5":5,"6":6,"7":7}],5:[function(_dereq_,module,exports){
var HTML_ALPHA = ['apos', 'nbsp', 'iexcl', 'cent', 'pound', 'curren', 'yen', 'brvbar', 'sect', 'uml', 'copy', 'ordf', 'laquo', 'not', 'shy', 'reg', 'macr', 'deg', 'plusmn', 'sup2', 'sup3', 'acute', 'micro', 'para', 'middot', 'cedil', 'sup1', 'ordm', 'raquo', 'frac14', 'frac12', 'frac34', 'iquest', 'Agrave', 'Aacute', 'Acirc', 'Atilde', 'Auml', 'Aring', 'Aelig', 'Ccedil', 'Egrave', 'Eacute', 'Ecirc', 'Euml', 'Igrave', 'Iacute', 'Icirc', 'Iuml', 'ETH', 'Ntilde', 'Ograve', 'Oacute', 'Ocirc', 'Otilde', 'Ouml', 'times', 'Oslash', 'Ugrave', 'Uacute', 'Ucirc', 'Uuml', 'Yacute', 'THORN', 'szlig', 'agrave', 'aacute', 'acirc', 'atilde', 'auml', 'aring', 'aelig', 'ccedil', 'egrave', 'eacute', 'ecirc', 'euml', 'igrave', 'iacute', 'icirc', 'iuml', 'eth', 'ntilde', 'ograve', 'oacute', 'ocirc', 'otilde', 'ouml', 'divide', 'oslash', 'ugrave', 'uacute', 'ucirc', 'uuml', 'yacute', 'thorn', 'yuml', 'quot', 'amp', 'lt', 'gt', 'OElig', 'oelig', 'Scaron', 'scaron', 'Yuml', 'circ', 'tilde', 'ensp', 'emsp', 'thinsp', 'zwnj', 'zwj', 'lrm', 'rlm', 'ndash', 'mdash', 'lsquo', 'rsquo', 'sbquo', 'ldquo', 'rdquo', 'bdquo', 'dagger', 'Dagger', 'permil', 'lsaquo', 'rsaquo', 'euro', 'fnof', 'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega', 'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho', 'sigmaf', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega', 'thetasym', 'upsih', 'piv', 'bull', 'hellip', 'prime', 'Prime', 'oline', 'frasl', 'weierp', 'image', 'real', 'trade', 'alefsym', 'larr', 'uarr', 'rarr', 'darr', 'harr', 'crarr', 'lArr', 'uArr', 'rArr', 'dArr', 'hArr', 'forall', 'part', 'exist', 'empty', 'nabla', 'isin', 'notin', 'ni', 'prod', 'sum', 'minus', 'lowast', 'radic', 'prop', 'infin', 'ang', 'and', 'or', 'cap', 'cup', 'int', 'there4', 'sim', 'cong', 'asymp', 'ne', 'equiv', 'le', 'ge', 'sub', 'sup', 'nsub', 'sube', 'supe', 'oplus', 'otimes', 'perp', 'sdot', 'lceil', 'rceil', 'lfloor', 'rfloor', 'lang', 'rang', 'loz', 'spades', 'clubs', 'hearts', 'diams'];
var HTML_CODES = [39, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 34, 38, 60, 62, 338, 339, 352, 353, 376, 710, 732, 8194, 8195, 8201, 8204, 8205, 8206, 8207, 8211, 8212, 8216, 8217, 8218, 8220, 8221, 8222, 8224, 8225, 8240, 8249, 8250, 8364, 402, 913, 914, 915, 916, 917, 918, 919, 920, 921, 922, 923, 924, 925, 926, 927, 928, 929, 931, 932, 933, 934, 935, 936, 937, 945, 946, 947, 948, 949, 950, 951, 952, 953, 954, 955, 956, 957, 958, 959, 960, 961, 962, 963, 964, 965, 966, 967, 968, 969, 977, 978, 982, 8226, 8230, 8242, 8243, 8254, 8260, 8472, 8465, 8476, 8482, 8501, 8592, 8593, 8594, 8595, 8596, 8629, 8656, 8657, 8658, 8659, 8660, 8704, 8706, 8707, 8709, 8711, 8712, 8713, 8715, 8719, 8721, 8722, 8727, 8730, 8733, 8734, 8736, 8743, 8744, 8745, 8746, 8747, 8756, 8764, 8773, 8776, 8800, 8801, 8804, 8805, 8834, 8835, 8836, 8838, 8839, 8853, 8855, 8869, 8901, 8968, 8969, 8970, 8971, 9001, 9002, 9674, 9824, 9827, 9829, 9830];

var alphaIndex = {};
var numIndex = {};

var i = 0;
var length = HTML_ALPHA.length;
while (i < length) {
    var a = HTML_ALPHA[i];
    var c = HTML_CODES[i];
    alphaIndex[a] = String.fromCharCode(c);
    numIndex[c] = a;
    i++;
}

/**
 * @constructor
 */
function Html4Entities() {}

/**
 * @param {String} str
 * @returns {String}
 */
Html4Entities.prototype.decode = function(str) {
    if (!str || !str.length) {
        return '';
    }
    return str.replace(/&(#?[\w\d]+);?/g, function(s, entity) {
        var chr;
        if (entity.charAt(0) === "#") {
            var code = entity.charAt(1).toLowerCase() === 'x' ?
                parseInt(entity.substr(2), 16) :
                parseInt(entity.substr(1));

            if (!(isNaN(code) || code < -32768 || code > 65535)) {
                chr = String.fromCharCode(code);
            }
        } else {
            chr = alphaIndex[entity];
        }
        return chr || s;
    });
};

/**
 * @param {String} str
 * @returns {String}
 */
Html4Entities.decode = function(str) {
    return new Html4Entities().decode(str);
};

/**
 * @param {String} str
 * @returns {String}
 */
Html4Entities.prototype.encode = function(str) {
    if (!str || !str.length) {
        return '';
    }
    var strLength = str.length;
    var result = '';
    var i = 0;
    while (i < strLength) {
        var alpha = numIndex[str.charCodeAt(i)];
        result += alpha ? "&" + alpha + ";" : str.charAt(i);
        i++;
    }
    return result;
};

/**
 * @param {String} str
 * @returns {String}
 */
Html4Entities.encode = function(str) {
    return new Html4Entities().encode(str);
};

/**
 * @param {String} str
 * @returns {String}
 */
Html4Entities.prototype.encodeNonUTF = function(str) {
    if (!str || !str.length) {
        return '';
    }
    var strLength = str.length;
    var result = '';
    var i = 0;
    while (i < strLength) {
        var cc = str.charCodeAt(i);
        var alpha = numIndex[cc];
        if (alpha) {
            result += "&" + alpha + ";";
        } else if (cc < 32 || cc > 126) {
            result += "&#" + cc + ";";
        } else {
            result += str.charAt(i);
        }
        i++;
    }
    return result;
};

/**
 * @param {String} str
 * @returns {String}
 */
Html4Entities.encodeNonUTF = function(str) {
    return new Html4Entities().encodeNonUTF(str);
};

/**
 * @param {String} str
 * @returns {String}
 */
Html4Entities.prototype.encodeNonASCII = function(str) {
    if (!str || !str.length) {
        return '';
    }
    var strLength = str.length;
    var result = '';
    var i = 0;
    while (i < strLength) {
        var c = str.charCodeAt(i);
        if (c <= 255) {
            result += str[i++];
            continue;
        }
        result += '&#' + c + ';';
        i++;
    }
    return result;
};

/**
 * @param {String} str
 * @returns {String}
 */
Html4Entities.encodeNonASCII = function(str) {
    return new Html4Entities().encodeNonASCII(str);
};

module.exports = Html4Entities;

},{}],6:[function(_dereq_,module,exports){
var ENTITIES = [['Aacute', [193]], ['aacute', [225]], ['Abreve', [258]], ['abreve', [259]], ['ac', [8766]], ['acd', [8767]], ['acE', [8766, 819]], ['Acirc', [194]], ['acirc', [226]], ['acute', [180]], ['Acy', [1040]], ['acy', [1072]], ['AElig', [198]], ['aelig', [230]], ['af', [8289]], ['Afr', [120068]], ['afr', [120094]], ['Agrave', [192]], ['agrave', [224]], ['alefsym', [8501]], ['aleph', [8501]], ['Alpha', [913]], ['alpha', [945]], ['Amacr', [256]], ['amacr', [257]], ['amalg', [10815]], ['amp', [38]], ['AMP', [38]], ['andand', [10837]], ['And', [10835]], ['and', [8743]], ['andd', [10844]], ['andslope', [10840]], ['andv', [10842]], ['ang', [8736]], ['ange', [10660]], ['angle', [8736]], ['angmsdaa', [10664]], ['angmsdab', [10665]], ['angmsdac', [10666]], ['angmsdad', [10667]], ['angmsdae', [10668]], ['angmsdaf', [10669]], ['angmsdag', [10670]], ['angmsdah', [10671]], ['angmsd', [8737]], ['angrt', [8735]], ['angrtvb', [8894]], ['angrtvbd', [10653]], ['angsph', [8738]], ['angst', [197]], ['angzarr', [9084]], ['Aogon', [260]], ['aogon', [261]], ['Aopf', [120120]], ['aopf', [120146]], ['apacir', [10863]], ['ap', [8776]], ['apE', [10864]], ['ape', [8778]], ['apid', [8779]], ['apos', [39]], ['ApplyFunction', [8289]], ['approx', [8776]], ['approxeq', [8778]], ['Aring', [197]], ['aring', [229]], ['Ascr', [119964]], ['ascr', [119990]], ['Assign', [8788]], ['ast', [42]], ['asymp', [8776]], ['asympeq', [8781]], ['Atilde', [195]], ['atilde', [227]], ['Auml', [196]], ['auml', [228]], ['awconint', [8755]], ['awint', [10769]], ['backcong', [8780]], ['backepsilon', [1014]], ['backprime', [8245]], ['backsim', [8765]], ['backsimeq', [8909]], ['Backslash', [8726]], ['Barv', [10983]], ['barvee', [8893]], ['barwed', [8965]], ['Barwed', [8966]], ['barwedge', [8965]], ['bbrk', [9141]], ['bbrktbrk', [9142]], ['bcong', [8780]], ['Bcy', [1041]], ['bcy', [1073]], ['bdquo', [8222]], ['becaus', [8757]], ['because', [8757]], ['Because', [8757]], ['bemptyv', [10672]], ['bepsi', [1014]], ['bernou', [8492]], ['Bernoullis', [8492]], ['Beta', [914]], ['beta', [946]], ['beth', [8502]], ['between', [8812]], ['Bfr', [120069]], ['bfr', [120095]], ['bigcap', [8898]], ['bigcirc', [9711]], ['bigcup', [8899]], ['bigodot', [10752]], ['bigoplus', [10753]], ['bigotimes', [10754]], ['bigsqcup', [10758]], ['bigstar', [9733]], ['bigtriangledown', [9661]], ['bigtriangleup', [9651]], ['biguplus', [10756]], ['bigvee', [8897]], ['bigwedge', [8896]], ['bkarow', [10509]], ['blacklozenge', [10731]], ['blacksquare', [9642]], ['blacktriangle', [9652]], ['blacktriangledown', [9662]], ['blacktriangleleft', [9666]], ['blacktriangleright', [9656]], ['blank', [9251]], ['blk12', [9618]], ['blk14', [9617]], ['blk34', [9619]], ['block', [9608]], ['bne', [61, 8421]], ['bnequiv', [8801, 8421]], ['bNot', [10989]], ['bnot', [8976]], ['Bopf', [120121]], ['bopf', [120147]], ['bot', [8869]], ['bottom', [8869]], ['bowtie', [8904]], ['boxbox', [10697]], ['boxdl', [9488]], ['boxdL', [9557]], ['boxDl', [9558]], ['boxDL', [9559]], ['boxdr', [9484]], ['boxdR', [9554]], ['boxDr', [9555]], ['boxDR', [9556]], ['boxh', [9472]], ['boxH', [9552]], ['boxhd', [9516]], ['boxHd', [9572]], ['boxhD', [9573]], ['boxHD', [9574]], ['boxhu', [9524]], ['boxHu', [9575]], ['boxhU', [9576]], ['boxHU', [9577]], ['boxminus', [8863]], ['boxplus', [8862]], ['boxtimes', [8864]], ['boxul', [9496]], ['boxuL', [9563]], ['boxUl', [9564]], ['boxUL', [9565]], ['boxur', [9492]], ['boxuR', [9560]], ['boxUr', [9561]], ['boxUR', [9562]], ['boxv', [9474]], ['boxV', [9553]], ['boxvh', [9532]], ['boxvH', [9578]], ['boxVh', [9579]], ['boxVH', [9580]], ['boxvl', [9508]], ['boxvL', [9569]], ['boxVl', [9570]], ['boxVL', [9571]], ['boxvr', [9500]], ['boxvR', [9566]], ['boxVr', [9567]], ['boxVR', [9568]], ['bprime', [8245]], ['breve', [728]], ['Breve', [728]], ['brvbar', [166]], ['bscr', [119991]], ['Bscr', [8492]], ['bsemi', [8271]], ['bsim', [8765]], ['bsime', [8909]], ['bsolb', [10693]], ['bsol', [92]], ['bsolhsub', [10184]], ['bull', [8226]], ['bullet', [8226]], ['bump', [8782]], ['bumpE', [10926]], ['bumpe', [8783]], ['Bumpeq', [8782]], ['bumpeq', [8783]], ['Cacute', [262]], ['cacute', [263]], ['capand', [10820]], ['capbrcup', [10825]], ['capcap', [10827]], ['cap', [8745]], ['Cap', [8914]], ['capcup', [10823]], ['capdot', [10816]], ['CapitalDifferentialD', [8517]], ['caps', [8745, 65024]], ['caret', [8257]], ['caron', [711]], ['Cayleys', [8493]], ['ccaps', [10829]], ['Ccaron', [268]], ['ccaron', [269]], ['Ccedil', [199]], ['ccedil', [231]], ['Ccirc', [264]], ['ccirc', [265]], ['Cconint', [8752]], ['ccups', [10828]], ['ccupssm', [10832]], ['Cdot', [266]], ['cdot', [267]], ['cedil', [184]], ['Cedilla', [184]], ['cemptyv', [10674]], ['cent', [162]], ['centerdot', [183]], ['CenterDot', [183]], ['cfr', [120096]], ['Cfr', [8493]], ['CHcy', [1063]], ['chcy', [1095]], ['check', [10003]], ['checkmark', [10003]], ['Chi', [935]], ['chi', [967]], ['circ', [710]], ['circeq', [8791]], ['circlearrowleft', [8634]], ['circlearrowright', [8635]], ['circledast', [8859]], ['circledcirc', [8858]], ['circleddash', [8861]], ['CircleDot', [8857]], ['circledR', [174]], ['circledS', [9416]], ['CircleMinus', [8854]], ['CirclePlus', [8853]], ['CircleTimes', [8855]], ['cir', [9675]], ['cirE', [10691]], ['cire', [8791]], ['cirfnint', [10768]], ['cirmid', [10991]], ['cirscir', [10690]], ['ClockwiseContourIntegral', [8754]], ['clubs', [9827]], ['clubsuit', [9827]], ['colon', [58]], ['Colon', [8759]], ['Colone', [10868]], ['colone', [8788]], ['coloneq', [8788]], ['comma', [44]], ['commat', [64]], ['comp', [8705]], ['compfn', [8728]], ['complement', [8705]], ['complexes', [8450]], ['cong', [8773]], ['congdot', [10861]], ['Congruent', [8801]], ['conint', [8750]], ['Conint', [8751]], ['ContourIntegral', [8750]], ['copf', [120148]], ['Copf', [8450]], ['coprod', [8720]], ['Coproduct', [8720]], ['copy', [169]], ['COPY', [169]], ['copysr', [8471]], ['CounterClockwiseContourIntegral', [8755]], ['crarr', [8629]], ['cross', [10007]], ['Cross', [10799]], ['Cscr', [119966]], ['cscr', [119992]], ['csub', [10959]], ['csube', [10961]], ['csup', [10960]], ['csupe', [10962]], ['ctdot', [8943]], ['cudarrl', [10552]], ['cudarrr', [10549]], ['cuepr', [8926]], ['cuesc', [8927]], ['cularr', [8630]], ['cularrp', [10557]], ['cupbrcap', [10824]], ['cupcap', [10822]], ['CupCap', [8781]], ['cup', [8746]], ['Cup', [8915]], ['cupcup', [10826]], ['cupdot', [8845]], ['cupor', [10821]], ['cups', [8746, 65024]], ['curarr', [8631]], ['curarrm', [10556]], ['curlyeqprec', [8926]], ['curlyeqsucc', [8927]], ['curlyvee', [8910]], ['curlywedge', [8911]], ['curren', [164]], ['curvearrowleft', [8630]], ['curvearrowright', [8631]], ['cuvee', [8910]], ['cuwed', [8911]], ['cwconint', [8754]], ['cwint', [8753]], ['cylcty', [9005]], ['dagger', [8224]], ['Dagger', [8225]], ['daleth', [8504]], ['darr', [8595]], ['Darr', [8609]], ['dArr', [8659]], ['dash', [8208]], ['Dashv', [10980]], ['dashv', [8867]], ['dbkarow', [10511]], ['dblac', [733]], ['Dcaron', [270]], ['dcaron', [271]], ['Dcy', [1044]], ['dcy', [1076]], ['ddagger', [8225]], ['ddarr', [8650]], ['DD', [8517]], ['dd', [8518]], ['DDotrahd', [10513]], ['ddotseq', [10871]], ['deg', [176]], ['Del', [8711]], ['Delta', [916]], ['delta', [948]], ['demptyv', [10673]], ['dfisht', [10623]], ['Dfr', [120071]], ['dfr', [120097]], ['dHar', [10597]], ['dharl', [8643]], ['dharr', [8642]], ['DiacriticalAcute', [180]], ['DiacriticalDot', [729]], ['DiacriticalDoubleAcute', [733]], ['DiacriticalGrave', [96]], ['DiacriticalTilde', [732]], ['diam', [8900]], ['diamond', [8900]], ['Diamond', [8900]], ['diamondsuit', [9830]], ['diams', [9830]], ['die', [168]], ['DifferentialD', [8518]], ['digamma', [989]], ['disin', [8946]], ['div', [247]], ['divide', [247]], ['divideontimes', [8903]], ['divonx', [8903]], ['DJcy', [1026]], ['djcy', [1106]], ['dlcorn', [8990]], ['dlcrop', [8973]], ['dollar', [36]], ['Dopf', [120123]], ['dopf', [120149]], ['Dot', [168]], ['dot', [729]], ['DotDot', [8412]], ['doteq', [8784]], ['doteqdot', [8785]], ['DotEqual', [8784]], ['dotminus', [8760]], ['dotplus', [8724]], ['dotsquare', [8865]], ['doublebarwedge', [8966]], ['DoubleContourIntegral', [8751]], ['DoubleDot', [168]], ['DoubleDownArrow', [8659]], ['DoubleLeftArrow', [8656]], ['DoubleLeftRightArrow', [8660]], ['DoubleLeftTee', [10980]], ['DoubleLongLeftArrow', [10232]], ['DoubleLongLeftRightArrow', [10234]], ['DoubleLongRightArrow', [10233]], ['DoubleRightArrow', [8658]], ['DoubleRightTee', [8872]], ['DoubleUpArrow', [8657]], ['DoubleUpDownArrow', [8661]], ['DoubleVerticalBar', [8741]], ['DownArrowBar', [10515]], ['downarrow', [8595]], ['DownArrow', [8595]], ['Downarrow', [8659]], ['DownArrowUpArrow', [8693]], ['DownBreve', [785]], ['downdownarrows', [8650]], ['downharpoonleft', [8643]], ['downharpoonright', [8642]], ['DownLeftRightVector', [10576]], ['DownLeftTeeVector', [10590]], ['DownLeftVectorBar', [10582]], ['DownLeftVector', [8637]], ['DownRightTeeVector', [10591]], ['DownRightVectorBar', [10583]], ['DownRightVector', [8641]], ['DownTeeArrow', [8615]], ['DownTee', [8868]], ['drbkarow', [10512]], ['drcorn', [8991]], ['drcrop', [8972]], ['Dscr', [119967]], ['dscr', [119993]], ['DScy', [1029]], ['dscy', [1109]], ['dsol', [10742]], ['Dstrok', [272]], ['dstrok', [273]], ['dtdot', [8945]], ['dtri', [9663]], ['dtrif', [9662]], ['duarr', [8693]], ['duhar', [10607]], ['dwangle', [10662]], ['DZcy', [1039]], ['dzcy', [1119]], ['dzigrarr', [10239]], ['Eacute', [201]], ['eacute', [233]], ['easter', [10862]], ['Ecaron', [282]], ['ecaron', [283]], ['Ecirc', [202]], ['ecirc', [234]], ['ecir', [8790]], ['ecolon', [8789]], ['Ecy', [1069]], ['ecy', [1101]], ['eDDot', [10871]], ['Edot', [278]], ['edot', [279]], ['eDot', [8785]], ['ee', [8519]], ['efDot', [8786]], ['Efr', [120072]], ['efr', [120098]], ['eg', [10906]], ['Egrave', [200]], ['egrave', [232]], ['egs', [10902]], ['egsdot', [10904]], ['el', [10905]], ['Element', [8712]], ['elinters', [9191]], ['ell', [8467]], ['els', [10901]], ['elsdot', [10903]], ['Emacr', [274]], ['emacr', [275]], ['empty', [8709]], ['emptyset', [8709]], ['EmptySmallSquare', [9723]], ['emptyv', [8709]], ['EmptyVerySmallSquare', [9643]], ['emsp13', [8196]], ['emsp14', [8197]], ['emsp', [8195]], ['ENG', [330]], ['eng', [331]], ['ensp', [8194]], ['Eogon', [280]], ['eogon', [281]], ['Eopf', [120124]], ['eopf', [120150]], ['epar', [8917]], ['eparsl', [10723]], ['eplus', [10865]], ['epsi', [949]], ['Epsilon', [917]], ['epsilon', [949]], ['epsiv', [1013]], ['eqcirc', [8790]], ['eqcolon', [8789]], ['eqsim', [8770]], ['eqslantgtr', [10902]], ['eqslantless', [10901]], ['Equal', [10869]], ['equals', [61]], ['EqualTilde', [8770]], ['equest', [8799]], ['Equilibrium', [8652]], ['equiv', [8801]], ['equivDD', [10872]], ['eqvparsl', [10725]], ['erarr', [10609]], ['erDot', [8787]], ['escr', [8495]], ['Escr', [8496]], ['esdot', [8784]], ['Esim', [10867]], ['esim', [8770]], ['Eta', [919]], ['eta', [951]], ['ETH', [208]], ['eth', [240]], ['Euml', [203]], ['euml', [235]], ['euro', [8364]], ['excl', [33]], ['exist', [8707]], ['Exists', [8707]], ['expectation', [8496]], ['exponentiale', [8519]], ['ExponentialE', [8519]], ['fallingdotseq', [8786]], ['Fcy', [1060]], ['fcy', [1092]], ['female', [9792]], ['ffilig', [64259]], ['fflig', [64256]], ['ffllig', [64260]], ['Ffr', [120073]], ['ffr', [120099]], ['filig', [64257]], ['FilledSmallSquare', [9724]], ['FilledVerySmallSquare', [9642]], ['fjlig', [102, 106]], ['flat', [9837]], ['fllig', [64258]], ['fltns', [9649]], ['fnof', [402]], ['Fopf', [120125]], ['fopf', [120151]], ['forall', [8704]], ['ForAll', [8704]], ['fork', [8916]], ['forkv', [10969]], ['Fouriertrf', [8497]], ['fpartint', [10765]], ['frac12', [189]], ['frac13', [8531]], ['frac14', [188]], ['frac15', [8533]], ['frac16', [8537]], ['frac18', [8539]], ['frac23', [8532]], ['frac25', [8534]], ['frac34', [190]], ['frac35', [8535]], ['frac38', [8540]], ['frac45', [8536]], ['frac56', [8538]], ['frac58', [8541]], ['frac78', [8542]], ['frasl', [8260]], ['frown', [8994]], ['fscr', [119995]], ['Fscr', [8497]], ['gacute', [501]], ['Gamma', [915]], ['gamma', [947]], ['Gammad', [988]], ['gammad', [989]], ['gap', [10886]], ['Gbreve', [286]], ['gbreve', [287]], ['Gcedil', [290]], ['Gcirc', [284]], ['gcirc', [285]], ['Gcy', [1043]], ['gcy', [1075]], ['Gdot', [288]], ['gdot', [289]], ['ge', [8805]], ['gE', [8807]], ['gEl', [10892]], ['gel', [8923]], ['geq', [8805]], ['geqq', [8807]], ['geqslant', [10878]], ['gescc', [10921]], ['ges', [10878]], ['gesdot', [10880]], ['gesdoto', [10882]], ['gesdotol', [10884]], ['gesl', [8923, 65024]], ['gesles', [10900]], ['Gfr', [120074]], ['gfr', [120100]], ['gg', [8811]], ['Gg', [8921]], ['ggg', [8921]], ['gimel', [8503]], ['GJcy', [1027]], ['gjcy', [1107]], ['gla', [10917]], ['gl', [8823]], ['glE', [10898]], ['glj', [10916]], ['gnap', [10890]], ['gnapprox', [10890]], ['gne', [10888]], ['gnE', [8809]], ['gneq', [10888]], ['gneqq', [8809]], ['gnsim', [8935]], ['Gopf', [120126]], ['gopf', [120152]], ['grave', [96]], ['GreaterEqual', [8805]], ['GreaterEqualLess', [8923]], ['GreaterFullEqual', [8807]], ['GreaterGreater', [10914]], ['GreaterLess', [8823]], ['GreaterSlantEqual', [10878]], ['GreaterTilde', [8819]], ['Gscr', [119970]], ['gscr', [8458]], ['gsim', [8819]], ['gsime', [10894]], ['gsiml', [10896]], ['gtcc', [10919]], ['gtcir', [10874]], ['gt', [62]], ['GT', [62]], ['Gt', [8811]], ['gtdot', [8919]], ['gtlPar', [10645]], ['gtquest', [10876]], ['gtrapprox', [10886]], ['gtrarr', [10616]], ['gtrdot', [8919]], ['gtreqless', [8923]], ['gtreqqless', [10892]], ['gtrless', [8823]], ['gtrsim', [8819]], ['gvertneqq', [8809, 65024]], ['gvnE', [8809, 65024]], ['Hacek', [711]], ['hairsp', [8202]], ['half', [189]], ['hamilt', [8459]], ['HARDcy', [1066]], ['hardcy', [1098]], ['harrcir', [10568]], ['harr', [8596]], ['hArr', [8660]], ['harrw', [8621]], ['Hat', [94]], ['hbar', [8463]], ['Hcirc', [292]], ['hcirc', [293]], ['hearts', [9829]], ['heartsuit', [9829]], ['hellip', [8230]], ['hercon', [8889]], ['hfr', [120101]], ['Hfr', [8460]], ['HilbertSpace', [8459]], ['hksearow', [10533]], ['hkswarow', [10534]], ['hoarr', [8703]], ['homtht', [8763]], ['hookleftarrow', [8617]], ['hookrightarrow', [8618]], ['hopf', [120153]], ['Hopf', [8461]], ['horbar', [8213]], ['HorizontalLine', [9472]], ['hscr', [119997]], ['Hscr', [8459]], ['hslash', [8463]], ['Hstrok', [294]], ['hstrok', [295]], ['HumpDownHump', [8782]], ['HumpEqual', [8783]], ['hybull', [8259]], ['hyphen', [8208]], ['Iacute', [205]], ['iacute', [237]], ['ic', [8291]], ['Icirc', [206]], ['icirc', [238]], ['Icy', [1048]], ['icy', [1080]], ['Idot', [304]], ['IEcy', [1045]], ['iecy', [1077]], ['iexcl', [161]], ['iff', [8660]], ['ifr', [120102]], ['Ifr', [8465]], ['Igrave', [204]], ['igrave', [236]], ['ii', [8520]], ['iiiint', [10764]], ['iiint', [8749]], ['iinfin', [10716]], ['iiota', [8489]], ['IJlig', [306]], ['ijlig', [307]], ['Imacr', [298]], ['imacr', [299]], ['image', [8465]], ['ImaginaryI', [8520]], ['imagline', [8464]], ['imagpart', [8465]], ['imath', [305]], ['Im', [8465]], ['imof', [8887]], ['imped', [437]], ['Implies', [8658]], ['incare', [8453]], ['in', [8712]], ['infin', [8734]], ['infintie', [10717]], ['inodot', [305]], ['intcal', [8890]], ['int', [8747]], ['Int', [8748]], ['integers', [8484]], ['Integral', [8747]], ['intercal', [8890]], ['Intersection', [8898]], ['intlarhk', [10775]], ['intprod', [10812]], ['InvisibleComma', [8291]], ['InvisibleTimes', [8290]], ['IOcy', [1025]], ['iocy', [1105]], ['Iogon', [302]], ['iogon', [303]], ['Iopf', [120128]], ['iopf', [120154]], ['Iota', [921]], ['iota', [953]], ['iprod', [10812]], ['iquest', [191]], ['iscr', [119998]], ['Iscr', [8464]], ['isin', [8712]], ['isindot', [8949]], ['isinE', [8953]], ['isins', [8948]], ['isinsv', [8947]], ['isinv', [8712]], ['it', [8290]], ['Itilde', [296]], ['itilde', [297]], ['Iukcy', [1030]], ['iukcy', [1110]], ['Iuml', [207]], ['iuml', [239]], ['Jcirc', [308]], ['jcirc', [309]], ['Jcy', [1049]], ['jcy', [1081]], ['Jfr', [120077]], ['jfr', [120103]], ['jmath', [567]], ['Jopf', [120129]], ['jopf', [120155]], ['Jscr', [119973]], ['jscr', [119999]], ['Jsercy', [1032]], ['jsercy', [1112]], ['Jukcy', [1028]], ['jukcy', [1108]], ['Kappa', [922]], ['kappa', [954]], ['kappav', [1008]], ['Kcedil', [310]], ['kcedil', [311]], ['Kcy', [1050]], ['kcy', [1082]], ['Kfr', [120078]], ['kfr', [120104]], ['kgreen', [312]], ['KHcy', [1061]], ['khcy', [1093]], ['KJcy', [1036]], ['kjcy', [1116]], ['Kopf', [120130]], ['kopf', [120156]], ['Kscr', [119974]], ['kscr', [120000]], ['lAarr', [8666]], ['Lacute', [313]], ['lacute', [314]], ['laemptyv', [10676]], ['lagran', [8466]], ['Lambda', [923]], ['lambda', [955]], ['lang', [10216]], ['Lang', [10218]], ['langd', [10641]], ['langle', [10216]], ['lap', [10885]], ['Laplacetrf', [8466]], ['laquo', [171]], ['larrb', [8676]], ['larrbfs', [10527]], ['larr', [8592]], ['Larr', [8606]], ['lArr', [8656]], ['larrfs', [10525]], ['larrhk', [8617]], ['larrlp', [8619]], ['larrpl', [10553]], ['larrsim', [10611]], ['larrtl', [8610]], ['latail', [10521]], ['lAtail', [10523]], ['lat', [10923]], ['late', [10925]], ['lates', [10925, 65024]], ['lbarr', [10508]], ['lBarr', [10510]], ['lbbrk', [10098]], ['lbrace', [123]], ['lbrack', [91]], ['lbrke', [10635]], ['lbrksld', [10639]], ['lbrkslu', [10637]], ['Lcaron', [317]], ['lcaron', [318]], ['Lcedil', [315]], ['lcedil', [316]], ['lceil', [8968]], ['lcub', [123]], ['Lcy', [1051]], ['lcy', [1083]], ['ldca', [10550]], ['ldquo', [8220]], ['ldquor', [8222]], ['ldrdhar', [10599]], ['ldrushar', [10571]], ['ldsh', [8626]], ['le', [8804]], ['lE', [8806]], ['LeftAngleBracket', [10216]], ['LeftArrowBar', [8676]], ['leftarrow', [8592]], ['LeftArrow', [8592]], ['Leftarrow', [8656]], ['LeftArrowRightArrow', [8646]], ['leftarrowtail', [8610]], ['LeftCeiling', [8968]], ['LeftDoubleBracket', [10214]], ['LeftDownTeeVector', [10593]], ['LeftDownVectorBar', [10585]], ['LeftDownVector', [8643]], ['LeftFloor', [8970]], ['leftharpoondown', [8637]], ['leftharpoonup', [8636]], ['leftleftarrows', [8647]], ['leftrightarrow', [8596]], ['LeftRightArrow', [8596]], ['Leftrightarrow', [8660]], ['leftrightarrows', [8646]], ['leftrightharpoons', [8651]], ['leftrightsquigarrow', [8621]], ['LeftRightVector', [10574]], ['LeftTeeArrow', [8612]], ['LeftTee', [8867]], ['LeftTeeVector', [10586]], ['leftthreetimes', [8907]], ['LeftTriangleBar', [10703]], ['LeftTriangle', [8882]], ['LeftTriangleEqual', [8884]], ['LeftUpDownVector', [10577]], ['LeftUpTeeVector', [10592]], ['LeftUpVectorBar', [10584]], ['LeftUpVector', [8639]], ['LeftVectorBar', [10578]], ['LeftVector', [8636]], ['lEg', [10891]], ['leg', [8922]], ['leq', [8804]], ['leqq', [8806]], ['leqslant', [10877]], ['lescc', [10920]], ['les', [10877]], ['lesdot', [10879]], ['lesdoto', [10881]], ['lesdotor', [10883]], ['lesg', [8922, 65024]], ['lesges', [10899]], ['lessapprox', [10885]], ['lessdot', [8918]], ['lesseqgtr', [8922]], ['lesseqqgtr', [10891]], ['LessEqualGreater', [8922]], ['LessFullEqual', [8806]], ['LessGreater', [8822]], ['lessgtr', [8822]], ['LessLess', [10913]], ['lesssim', [8818]], ['LessSlantEqual', [10877]], ['LessTilde', [8818]], ['lfisht', [10620]], ['lfloor', [8970]], ['Lfr', [120079]], ['lfr', [120105]], ['lg', [8822]], ['lgE', [10897]], ['lHar', [10594]], ['lhard', [8637]], ['lharu', [8636]], ['lharul', [10602]], ['lhblk', [9604]], ['LJcy', [1033]], ['ljcy', [1113]], ['llarr', [8647]], ['ll', [8810]], ['Ll', [8920]], ['llcorner', [8990]], ['Lleftarrow', [8666]], ['llhard', [10603]], ['lltri', [9722]], ['Lmidot', [319]], ['lmidot', [320]], ['lmoustache', [9136]], ['lmoust', [9136]], ['lnap', [10889]], ['lnapprox', [10889]], ['lne', [10887]], ['lnE', [8808]], ['lneq', [10887]], ['lneqq', [8808]], ['lnsim', [8934]], ['loang', [10220]], ['loarr', [8701]], ['lobrk', [10214]], ['longleftarrow', [10229]], ['LongLeftArrow', [10229]], ['Longleftarrow', [10232]], ['longleftrightarrow', [10231]], ['LongLeftRightArrow', [10231]], ['Longleftrightarrow', [10234]], ['longmapsto', [10236]], ['longrightarrow', [10230]], ['LongRightArrow', [10230]], ['Longrightarrow', [10233]], ['looparrowleft', [8619]], ['looparrowright', [8620]], ['lopar', [10629]], ['Lopf', [120131]], ['lopf', [120157]], ['loplus', [10797]], ['lotimes', [10804]], ['lowast', [8727]], ['lowbar', [95]], ['LowerLeftArrow', [8601]], ['LowerRightArrow', [8600]], ['loz', [9674]], ['lozenge', [9674]], ['lozf', [10731]], ['lpar', [40]], ['lparlt', [10643]], ['lrarr', [8646]], ['lrcorner', [8991]], ['lrhar', [8651]], ['lrhard', [10605]], ['lrm', [8206]], ['lrtri', [8895]], ['lsaquo', [8249]], ['lscr', [120001]], ['Lscr', [8466]], ['lsh', [8624]], ['Lsh', [8624]], ['lsim', [8818]], ['lsime', [10893]], ['lsimg', [10895]], ['lsqb', [91]], ['lsquo', [8216]], ['lsquor', [8218]], ['Lstrok', [321]], ['lstrok', [322]], ['ltcc', [10918]], ['ltcir', [10873]], ['lt', [60]], ['LT', [60]], ['Lt', [8810]], ['ltdot', [8918]], ['lthree', [8907]], ['ltimes', [8905]], ['ltlarr', [10614]], ['ltquest', [10875]], ['ltri', [9667]], ['ltrie', [8884]], ['ltrif', [9666]], ['ltrPar', [10646]], ['lurdshar', [10570]], ['luruhar', [10598]], ['lvertneqq', [8808, 65024]], ['lvnE', [8808, 65024]], ['macr', [175]], ['male', [9794]], ['malt', [10016]], ['maltese', [10016]], ['Map', [10501]], ['map', [8614]], ['mapsto', [8614]], ['mapstodown', [8615]], ['mapstoleft', [8612]], ['mapstoup', [8613]], ['marker', [9646]], ['mcomma', [10793]], ['Mcy', [1052]], ['mcy', [1084]], ['mdash', [8212]], ['mDDot', [8762]], ['measuredangle', [8737]], ['MediumSpace', [8287]], ['Mellintrf', [8499]], ['Mfr', [120080]], ['mfr', [120106]], ['mho', [8487]], ['micro', [181]], ['midast', [42]], ['midcir', [10992]], ['mid', [8739]], ['middot', [183]], ['minusb', [8863]], ['minus', [8722]], ['minusd', [8760]], ['minusdu', [10794]], ['MinusPlus', [8723]], ['mlcp', [10971]], ['mldr', [8230]], ['mnplus', [8723]], ['models', [8871]], ['Mopf', [120132]], ['mopf', [120158]], ['mp', [8723]], ['mscr', [120002]], ['Mscr', [8499]], ['mstpos', [8766]], ['Mu', [924]], ['mu', [956]], ['multimap', [8888]], ['mumap', [8888]], ['nabla', [8711]], ['Nacute', [323]], ['nacute', [324]], ['nang', [8736, 8402]], ['nap', [8777]], ['napE', [10864, 824]], ['napid', [8779, 824]], ['napos', [329]], ['napprox', [8777]], ['natural', [9838]], ['naturals', [8469]], ['natur', [9838]], ['nbsp', [160]], ['nbump', [8782, 824]], ['nbumpe', [8783, 824]], ['ncap', [10819]], ['Ncaron', [327]], ['ncaron', [328]], ['Ncedil', [325]], ['ncedil', [326]], ['ncong', [8775]], ['ncongdot', [10861, 824]], ['ncup', [10818]], ['Ncy', [1053]], ['ncy', [1085]], ['ndash', [8211]], ['nearhk', [10532]], ['nearr', [8599]], ['neArr', [8663]], ['nearrow', [8599]], ['ne', [8800]], ['nedot', [8784, 824]], ['NegativeMediumSpace', [8203]], ['NegativeThickSpace', [8203]], ['NegativeThinSpace', [8203]], ['NegativeVeryThinSpace', [8203]], ['nequiv', [8802]], ['nesear', [10536]], ['nesim', [8770, 824]], ['NestedGreaterGreater', [8811]], ['NestedLessLess', [8810]], ['nexist', [8708]], ['nexists', [8708]], ['Nfr', [120081]], ['nfr', [120107]], ['ngE', [8807, 824]], ['nge', [8817]], ['ngeq', [8817]], ['ngeqq', [8807, 824]], ['ngeqslant', [10878, 824]], ['nges', [10878, 824]], ['nGg', [8921, 824]], ['ngsim', [8821]], ['nGt', [8811, 8402]], ['ngt', [8815]], ['ngtr', [8815]], ['nGtv', [8811, 824]], ['nharr', [8622]], ['nhArr', [8654]], ['nhpar', [10994]], ['ni', [8715]], ['nis', [8956]], ['nisd', [8954]], ['niv', [8715]], ['NJcy', [1034]], ['njcy', [1114]], ['nlarr', [8602]], ['nlArr', [8653]], ['nldr', [8229]], ['nlE', [8806, 824]], ['nle', [8816]], ['nleftarrow', [8602]], ['nLeftarrow', [8653]], ['nleftrightarrow', [8622]], ['nLeftrightarrow', [8654]], ['nleq', [8816]], ['nleqq', [8806, 824]], ['nleqslant', [10877, 824]], ['nles', [10877, 824]], ['nless', [8814]], ['nLl', [8920, 824]], ['nlsim', [8820]], ['nLt', [8810, 8402]], ['nlt', [8814]], ['nltri', [8938]], ['nltrie', [8940]], ['nLtv', [8810, 824]], ['nmid', [8740]], ['NoBreak', [8288]], ['NonBreakingSpace', [160]], ['nopf', [120159]], ['Nopf', [8469]], ['Not', [10988]], ['not', [172]], ['NotCongruent', [8802]], ['NotCupCap', [8813]], ['NotDoubleVerticalBar', [8742]], ['NotElement', [8713]], ['NotEqual', [8800]], ['NotEqualTilde', [8770, 824]], ['NotExists', [8708]], ['NotGreater', [8815]], ['NotGreaterEqual', [8817]], ['NotGreaterFullEqual', [8807, 824]], ['NotGreaterGreater', [8811, 824]], ['NotGreaterLess', [8825]], ['NotGreaterSlantEqual', [10878, 824]], ['NotGreaterTilde', [8821]], ['NotHumpDownHump', [8782, 824]], ['NotHumpEqual', [8783, 824]], ['notin', [8713]], ['notindot', [8949, 824]], ['notinE', [8953, 824]], ['notinva', [8713]], ['notinvb', [8951]], ['notinvc', [8950]], ['NotLeftTriangleBar', [10703, 824]], ['NotLeftTriangle', [8938]], ['NotLeftTriangleEqual', [8940]], ['NotLess', [8814]], ['NotLessEqual', [8816]], ['NotLessGreater', [8824]], ['NotLessLess', [8810, 824]], ['NotLessSlantEqual', [10877, 824]], ['NotLessTilde', [8820]], ['NotNestedGreaterGreater', [10914, 824]], ['NotNestedLessLess', [10913, 824]], ['notni', [8716]], ['notniva', [8716]], ['notnivb', [8958]], ['notnivc', [8957]], ['NotPrecedes', [8832]], ['NotPrecedesEqual', [10927, 824]], ['NotPrecedesSlantEqual', [8928]], ['NotReverseElement', [8716]], ['NotRightTriangleBar', [10704, 824]], ['NotRightTriangle', [8939]], ['NotRightTriangleEqual', [8941]], ['NotSquareSubset', [8847, 824]], ['NotSquareSubsetEqual', [8930]], ['NotSquareSuperset', [8848, 824]], ['NotSquareSupersetEqual', [8931]], ['NotSubset', [8834, 8402]], ['NotSubsetEqual', [8840]], ['NotSucceeds', [8833]], ['NotSucceedsEqual', [10928, 824]], ['NotSucceedsSlantEqual', [8929]], ['NotSucceedsTilde', [8831, 824]], ['NotSuperset', [8835, 8402]], ['NotSupersetEqual', [8841]], ['NotTilde', [8769]], ['NotTildeEqual', [8772]], ['NotTildeFullEqual', [8775]], ['NotTildeTilde', [8777]], ['NotVerticalBar', [8740]], ['nparallel', [8742]], ['npar', [8742]], ['nparsl', [11005, 8421]], ['npart', [8706, 824]], ['npolint', [10772]], ['npr', [8832]], ['nprcue', [8928]], ['nprec', [8832]], ['npreceq', [10927, 824]], ['npre', [10927, 824]], ['nrarrc', [10547, 824]], ['nrarr', [8603]], ['nrArr', [8655]], ['nrarrw', [8605, 824]], ['nrightarrow', [8603]], ['nRightarrow', [8655]], ['nrtri', [8939]], ['nrtrie', [8941]], ['nsc', [8833]], ['nsccue', [8929]], ['nsce', [10928, 824]], ['Nscr', [119977]], ['nscr', [120003]], ['nshortmid', [8740]], ['nshortparallel', [8742]], ['nsim', [8769]], ['nsime', [8772]], ['nsimeq', [8772]], ['nsmid', [8740]], ['nspar', [8742]], ['nsqsube', [8930]], ['nsqsupe', [8931]], ['nsub', [8836]], ['nsubE', [10949, 824]], ['nsube', [8840]], ['nsubset', [8834, 8402]], ['nsubseteq', [8840]], ['nsubseteqq', [10949, 824]], ['nsucc', [8833]], ['nsucceq', [10928, 824]], ['nsup', [8837]], ['nsupE', [10950, 824]], ['nsupe', [8841]], ['nsupset', [8835, 8402]], ['nsupseteq', [8841]], ['nsupseteqq', [10950, 824]], ['ntgl', [8825]], ['Ntilde', [209]], ['ntilde', [241]], ['ntlg', [8824]], ['ntriangleleft', [8938]], ['ntrianglelefteq', [8940]], ['ntriangleright', [8939]], ['ntrianglerighteq', [8941]], ['Nu', [925]], ['nu', [957]], ['num', [35]], ['numero', [8470]], ['numsp', [8199]], ['nvap', [8781, 8402]], ['nvdash', [8876]], ['nvDash', [8877]], ['nVdash', [8878]], ['nVDash', [8879]], ['nvge', [8805, 8402]], ['nvgt', [62, 8402]], ['nvHarr', [10500]], ['nvinfin', [10718]], ['nvlArr', [10498]], ['nvle', [8804, 8402]], ['nvlt', [60, 8402]], ['nvltrie', [8884, 8402]], ['nvrArr', [10499]], ['nvrtrie', [8885, 8402]], ['nvsim', [8764, 8402]], ['nwarhk', [10531]], ['nwarr', [8598]], ['nwArr', [8662]], ['nwarrow', [8598]], ['nwnear', [10535]], ['Oacute', [211]], ['oacute', [243]], ['oast', [8859]], ['Ocirc', [212]], ['ocirc', [244]], ['ocir', [8858]], ['Ocy', [1054]], ['ocy', [1086]], ['odash', [8861]], ['Odblac', [336]], ['odblac', [337]], ['odiv', [10808]], ['odot', [8857]], ['odsold', [10684]], ['OElig', [338]], ['oelig', [339]], ['ofcir', [10687]], ['Ofr', [120082]], ['ofr', [120108]], ['ogon', [731]], ['Ograve', [210]], ['ograve', [242]], ['ogt', [10689]], ['ohbar', [10677]], ['ohm', [937]], ['oint', [8750]], ['olarr', [8634]], ['olcir', [10686]], ['olcross', [10683]], ['oline', [8254]], ['olt', [10688]], ['Omacr', [332]], ['omacr', [333]], ['Omega', [937]], ['omega', [969]], ['Omicron', [927]], ['omicron', [959]], ['omid', [10678]], ['ominus', [8854]], ['Oopf', [120134]], ['oopf', [120160]], ['opar', [10679]], ['OpenCurlyDoubleQuote', [8220]], ['OpenCurlyQuote', [8216]], ['operp', [10681]], ['oplus', [8853]], ['orarr', [8635]], ['Or', [10836]], ['or', [8744]], ['ord', [10845]], ['order', [8500]], ['orderof', [8500]], ['ordf', [170]], ['ordm', [186]], ['origof', [8886]], ['oror', [10838]], ['orslope', [10839]], ['orv', [10843]], ['oS', [9416]], ['Oscr', [119978]], ['oscr', [8500]], ['Oslash', [216]], ['oslash', [248]], ['osol', [8856]], ['Otilde', [213]], ['otilde', [245]], ['otimesas', [10806]], ['Otimes', [10807]], ['otimes', [8855]], ['Ouml', [214]], ['ouml', [246]], ['ovbar', [9021]], ['OverBar', [8254]], ['OverBrace', [9182]], ['OverBracket', [9140]], ['OverParenthesis', [9180]], ['para', [182]], ['parallel', [8741]], ['par', [8741]], ['parsim', [10995]], ['parsl', [11005]], ['part', [8706]], ['PartialD', [8706]], ['Pcy', [1055]], ['pcy', [1087]], ['percnt', [37]], ['period', [46]], ['permil', [8240]], ['perp', [8869]], ['pertenk', [8241]], ['Pfr', [120083]], ['pfr', [120109]], ['Phi', [934]], ['phi', [966]], ['phiv', [981]], ['phmmat', [8499]], ['phone', [9742]], ['Pi', [928]], ['pi', [960]], ['pitchfork', [8916]], ['piv', [982]], ['planck', [8463]], ['planckh', [8462]], ['plankv', [8463]], ['plusacir', [10787]], ['plusb', [8862]], ['pluscir', [10786]], ['plus', [43]], ['plusdo', [8724]], ['plusdu', [10789]], ['pluse', [10866]], ['PlusMinus', [177]], ['plusmn', [177]], ['plussim', [10790]], ['plustwo', [10791]], ['pm', [177]], ['Poincareplane', [8460]], ['pointint', [10773]], ['popf', [120161]], ['Popf', [8473]], ['pound', [163]], ['prap', [10935]], ['Pr', [10939]], ['pr', [8826]], ['prcue', [8828]], ['precapprox', [10935]], ['prec', [8826]], ['preccurlyeq', [8828]], ['Precedes', [8826]], ['PrecedesEqual', [10927]], ['PrecedesSlantEqual', [8828]], ['PrecedesTilde', [8830]], ['preceq', [10927]], ['precnapprox', [10937]], ['precneqq', [10933]], ['precnsim', [8936]], ['pre', [10927]], ['prE', [10931]], ['precsim', [8830]], ['prime', [8242]], ['Prime', [8243]], ['primes', [8473]], ['prnap', [10937]], ['prnE', [10933]], ['prnsim', [8936]], ['prod', [8719]], ['Product', [8719]], ['profalar', [9006]], ['profline', [8978]], ['profsurf', [8979]], ['prop', [8733]], ['Proportional', [8733]], ['Proportion', [8759]], ['propto', [8733]], ['prsim', [8830]], ['prurel', [8880]], ['Pscr', [119979]], ['pscr', [120005]], ['Psi', [936]], ['psi', [968]], ['puncsp', [8200]], ['Qfr', [120084]], ['qfr', [120110]], ['qint', [10764]], ['qopf', [120162]], ['Qopf', [8474]], ['qprime', [8279]], ['Qscr', [119980]], ['qscr', [120006]], ['quaternions', [8461]], ['quatint', [10774]], ['quest', [63]], ['questeq', [8799]], ['quot', [34]], ['QUOT', [34]], ['rAarr', [8667]], ['race', [8765, 817]], ['Racute', [340]], ['racute', [341]], ['radic', [8730]], ['raemptyv', [10675]], ['rang', [10217]], ['Rang', [10219]], ['rangd', [10642]], ['range', [10661]], ['rangle', [10217]], ['raquo', [187]], ['rarrap', [10613]], ['rarrb', [8677]], ['rarrbfs', [10528]], ['rarrc', [10547]], ['rarr', [8594]], ['Rarr', [8608]], ['rArr', [8658]], ['rarrfs', [10526]], ['rarrhk', [8618]], ['rarrlp', [8620]], ['rarrpl', [10565]], ['rarrsim', [10612]], ['Rarrtl', [10518]], ['rarrtl', [8611]], ['rarrw', [8605]], ['ratail', [10522]], ['rAtail', [10524]], ['ratio', [8758]], ['rationals', [8474]], ['rbarr', [10509]], ['rBarr', [10511]], ['RBarr', [10512]], ['rbbrk', [10099]], ['rbrace', [125]], ['rbrack', [93]], ['rbrke', [10636]], ['rbrksld', [10638]], ['rbrkslu', [10640]], ['Rcaron', [344]], ['rcaron', [345]], ['Rcedil', [342]], ['rcedil', [343]], ['rceil', [8969]], ['rcub', [125]], ['Rcy', [1056]], ['rcy', [1088]], ['rdca', [10551]], ['rdldhar', [10601]], ['rdquo', [8221]], ['rdquor', [8221]], ['CloseCurlyDoubleQuote', [8221]], ['rdsh', [8627]], ['real', [8476]], ['realine', [8475]], ['realpart', [8476]], ['reals', [8477]], ['Re', [8476]], ['rect', [9645]], ['reg', [174]], ['REG', [174]], ['ReverseElement', [8715]], ['ReverseEquilibrium', [8651]], ['ReverseUpEquilibrium', [10607]], ['rfisht', [10621]], ['rfloor', [8971]], ['rfr', [120111]], ['Rfr', [8476]], ['rHar', [10596]], ['rhard', [8641]], ['rharu', [8640]], ['rharul', [10604]], ['Rho', [929]], ['rho', [961]], ['rhov', [1009]], ['RightAngleBracket', [10217]], ['RightArrowBar', [8677]], ['rightarrow', [8594]], ['RightArrow', [8594]], ['Rightarrow', [8658]], ['RightArrowLeftArrow', [8644]], ['rightarrowtail', [8611]], ['RightCeiling', [8969]], ['RightDoubleBracket', [10215]], ['RightDownTeeVector', [10589]], ['RightDownVectorBar', [10581]], ['RightDownVector', [8642]], ['RightFloor', [8971]], ['rightharpoondown', [8641]], ['rightharpoonup', [8640]], ['rightleftarrows', [8644]], ['rightleftharpoons', [8652]], ['rightrightarrows', [8649]], ['rightsquigarrow', [8605]], ['RightTeeArrow', [8614]], ['RightTee', [8866]], ['RightTeeVector', [10587]], ['rightthreetimes', [8908]], ['RightTriangleBar', [10704]], ['RightTriangle', [8883]], ['RightTriangleEqual', [8885]], ['RightUpDownVector', [10575]], ['RightUpTeeVector', [10588]], ['RightUpVectorBar', [10580]], ['RightUpVector', [8638]], ['RightVectorBar', [10579]], ['RightVector', [8640]], ['ring', [730]], ['risingdotseq', [8787]], ['rlarr', [8644]], ['rlhar', [8652]], ['rlm', [8207]], ['rmoustache', [9137]], ['rmoust', [9137]], ['rnmid', [10990]], ['roang', [10221]], ['roarr', [8702]], ['robrk', [10215]], ['ropar', [10630]], ['ropf', [120163]], ['Ropf', [8477]], ['roplus', [10798]], ['rotimes', [10805]], ['RoundImplies', [10608]], ['rpar', [41]], ['rpargt', [10644]], ['rppolint', [10770]], ['rrarr', [8649]], ['Rrightarrow', [8667]], ['rsaquo', [8250]], ['rscr', [120007]], ['Rscr', [8475]], ['rsh', [8625]], ['Rsh', [8625]], ['rsqb', [93]], ['rsquo', [8217]], ['rsquor', [8217]], ['CloseCurlyQuote', [8217]], ['rthree', [8908]], ['rtimes', [8906]], ['rtri', [9657]], ['rtrie', [8885]], ['rtrif', [9656]], ['rtriltri', [10702]], ['RuleDelayed', [10740]], ['ruluhar', [10600]], ['rx', [8478]], ['Sacute', [346]], ['sacute', [347]], ['sbquo', [8218]], ['scap', [10936]], ['Scaron', [352]], ['scaron', [353]], ['Sc', [10940]], ['sc', [8827]], ['sccue', [8829]], ['sce', [10928]], ['scE', [10932]], ['Scedil', [350]], ['scedil', [351]], ['Scirc', [348]], ['scirc', [349]], ['scnap', [10938]], ['scnE', [10934]], ['scnsim', [8937]], ['scpolint', [10771]], ['scsim', [8831]], ['Scy', [1057]], ['scy', [1089]], ['sdotb', [8865]], ['sdot', [8901]], ['sdote', [10854]], ['searhk', [10533]], ['searr', [8600]], ['seArr', [8664]], ['searrow', [8600]], ['sect', [167]], ['semi', [59]], ['seswar', [10537]], ['setminus', [8726]], ['setmn', [8726]], ['sext', [10038]], ['Sfr', [120086]], ['sfr', [120112]], ['sfrown', [8994]], ['sharp', [9839]], ['SHCHcy', [1065]], ['shchcy', [1097]], ['SHcy', [1064]], ['shcy', [1096]], ['ShortDownArrow', [8595]], ['ShortLeftArrow', [8592]], ['shortmid', [8739]], ['shortparallel', [8741]], ['ShortRightArrow', [8594]], ['ShortUpArrow', [8593]], ['shy', [173]], ['Sigma', [931]], ['sigma', [963]], ['sigmaf', [962]], ['sigmav', [962]], ['sim', [8764]], ['simdot', [10858]], ['sime', [8771]], ['simeq', [8771]], ['simg', [10910]], ['simgE', [10912]], ['siml', [10909]], ['simlE', [10911]], ['simne', [8774]], ['simplus', [10788]], ['simrarr', [10610]], ['slarr', [8592]], ['SmallCircle', [8728]], ['smallsetminus', [8726]], ['smashp', [10803]], ['smeparsl', [10724]], ['smid', [8739]], ['smile', [8995]], ['smt', [10922]], ['smte', [10924]], ['smtes', [10924, 65024]], ['SOFTcy', [1068]], ['softcy', [1100]], ['solbar', [9023]], ['solb', [10692]], ['sol', [47]], ['Sopf', [120138]], ['sopf', [120164]], ['spades', [9824]], ['spadesuit', [9824]], ['spar', [8741]], ['sqcap', [8851]], ['sqcaps', [8851, 65024]], ['sqcup', [8852]], ['sqcups', [8852, 65024]], ['Sqrt', [8730]], ['sqsub', [8847]], ['sqsube', [8849]], ['sqsubset', [8847]], ['sqsubseteq', [8849]], ['sqsup', [8848]], ['sqsupe', [8850]], ['sqsupset', [8848]], ['sqsupseteq', [8850]], ['square', [9633]], ['Square', [9633]], ['SquareIntersection', [8851]], ['SquareSubset', [8847]], ['SquareSubsetEqual', [8849]], ['SquareSuperset', [8848]], ['SquareSupersetEqual', [8850]], ['SquareUnion', [8852]], ['squarf', [9642]], ['squ', [9633]], ['squf', [9642]], ['srarr', [8594]], ['Sscr', [119982]], ['sscr', [120008]], ['ssetmn', [8726]], ['ssmile', [8995]], ['sstarf', [8902]], ['Star', [8902]], ['star', [9734]], ['starf', [9733]], ['straightepsilon', [1013]], ['straightphi', [981]], ['strns', [175]], ['sub', [8834]], ['Sub', [8912]], ['subdot', [10941]], ['subE', [10949]], ['sube', [8838]], ['subedot', [10947]], ['submult', [10945]], ['subnE', [10955]], ['subne', [8842]], ['subplus', [10943]], ['subrarr', [10617]], ['subset', [8834]], ['Subset', [8912]], ['subseteq', [8838]], ['subseteqq', [10949]], ['SubsetEqual', [8838]], ['subsetneq', [8842]], ['subsetneqq', [10955]], ['subsim', [10951]], ['subsub', [10965]], ['subsup', [10963]], ['succapprox', [10936]], ['succ', [8827]], ['succcurlyeq', [8829]], ['Succeeds', [8827]], ['SucceedsEqual', [10928]], ['SucceedsSlantEqual', [8829]], ['SucceedsTilde', [8831]], ['succeq', [10928]], ['succnapprox', [10938]], ['succneqq', [10934]], ['succnsim', [8937]], ['succsim', [8831]], ['SuchThat', [8715]], ['sum', [8721]], ['Sum', [8721]], ['sung', [9834]], ['sup1', [185]], ['sup2', [178]], ['sup3', [179]], ['sup', [8835]], ['Sup', [8913]], ['supdot', [10942]], ['supdsub', [10968]], ['supE', [10950]], ['supe', [8839]], ['supedot', [10948]], ['Superset', [8835]], ['SupersetEqual', [8839]], ['suphsol', [10185]], ['suphsub', [10967]], ['suplarr', [10619]], ['supmult', [10946]], ['supnE', [10956]], ['supne', [8843]], ['supplus', [10944]], ['supset', [8835]], ['Supset', [8913]], ['supseteq', [8839]], ['supseteqq', [10950]], ['supsetneq', [8843]], ['supsetneqq', [10956]], ['supsim', [10952]], ['supsub', [10964]], ['supsup', [10966]], ['swarhk', [10534]], ['swarr', [8601]], ['swArr', [8665]], ['swarrow', [8601]], ['swnwar', [10538]], ['szlig', [223]], ['Tab', [9]], ['target', [8982]], ['Tau', [932]], ['tau', [964]], ['tbrk', [9140]], ['Tcaron', [356]], ['tcaron', [357]], ['Tcedil', [354]], ['tcedil', [355]], ['Tcy', [1058]], ['tcy', [1090]], ['tdot', [8411]], ['telrec', [8981]], ['Tfr', [120087]], ['tfr', [120113]], ['there4', [8756]], ['therefore', [8756]], ['Therefore', [8756]], ['Theta', [920]], ['theta', [952]], ['thetasym', [977]], ['thetav', [977]], ['thickapprox', [8776]], ['thicksim', [8764]], ['ThickSpace', [8287, 8202]], ['ThinSpace', [8201]], ['thinsp', [8201]], ['thkap', [8776]], ['thksim', [8764]], ['THORN', [222]], ['thorn', [254]], ['tilde', [732]], ['Tilde', [8764]], ['TildeEqual', [8771]], ['TildeFullEqual', [8773]], ['TildeTilde', [8776]], ['timesbar', [10801]], ['timesb', [8864]], ['times', [215]], ['timesd', [10800]], ['tint', [8749]], ['toea', [10536]], ['topbot', [9014]], ['topcir', [10993]], ['top', [8868]], ['Topf', [120139]], ['topf', [120165]], ['topfork', [10970]], ['tosa', [10537]], ['tprime', [8244]], ['trade', [8482]], ['TRADE', [8482]], ['triangle', [9653]], ['triangledown', [9663]], ['triangleleft', [9667]], ['trianglelefteq', [8884]], ['triangleq', [8796]], ['triangleright', [9657]], ['trianglerighteq', [8885]], ['tridot', [9708]], ['trie', [8796]], ['triminus', [10810]], ['TripleDot', [8411]], ['triplus', [10809]], ['trisb', [10701]], ['tritime', [10811]], ['trpezium', [9186]], ['Tscr', [119983]], ['tscr', [120009]], ['TScy', [1062]], ['tscy', [1094]], ['TSHcy', [1035]], ['tshcy', [1115]], ['Tstrok', [358]], ['tstrok', [359]], ['twixt', [8812]], ['twoheadleftarrow', [8606]], ['twoheadrightarrow', [8608]], ['Uacute', [218]], ['uacute', [250]], ['uarr', [8593]], ['Uarr', [8607]], ['uArr', [8657]], ['Uarrocir', [10569]], ['Ubrcy', [1038]], ['ubrcy', [1118]], ['Ubreve', [364]], ['ubreve', [365]], ['Ucirc', [219]], ['ucirc', [251]], ['Ucy', [1059]], ['ucy', [1091]], ['udarr', [8645]], ['Udblac', [368]], ['udblac', [369]], ['udhar', [10606]], ['ufisht', [10622]], ['Ufr', [120088]], ['ufr', [120114]], ['Ugrave', [217]], ['ugrave', [249]], ['uHar', [10595]], ['uharl', [8639]], ['uharr', [8638]], ['uhblk', [9600]], ['ulcorn', [8988]], ['ulcorner', [8988]], ['ulcrop', [8975]], ['ultri', [9720]], ['Umacr', [362]], ['umacr', [363]], ['uml', [168]], ['UnderBar', [95]], ['UnderBrace', [9183]], ['UnderBracket', [9141]], ['UnderParenthesis', [9181]], ['Union', [8899]], ['UnionPlus', [8846]], ['Uogon', [370]], ['uogon', [371]], ['Uopf', [120140]], ['uopf', [120166]], ['UpArrowBar', [10514]], ['uparrow', [8593]], ['UpArrow', [8593]], ['Uparrow', [8657]], ['UpArrowDownArrow', [8645]], ['updownarrow', [8597]], ['UpDownArrow', [8597]], ['Updownarrow', [8661]], ['UpEquilibrium', [10606]], ['upharpoonleft', [8639]], ['upharpoonright', [8638]], ['uplus', [8846]], ['UpperLeftArrow', [8598]], ['UpperRightArrow', [8599]], ['upsi', [965]], ['Upsi', [978]], ['upsih', [978]], ['Upsilon', [933]], ['upsilon', [965]], ['UpTeeArrow', [8613]], ['UpTee', [8869]], ['upuparrows', [8648]], ['urcorn', [8989]], ['urcorner', [8989]], ['urcrop', [8974]], ['Uring', [366]], ['uring', [367]], ['urtri', [9721]], ['Uscr', [119984]], ['uscr', [120010]], ['utdot', [8944]], ['Utilde', [360]], ['utilde', [361]], ['utri', [9653]], ['utrif', [9652]], ['uuarr', [8648]], ['Uuml', [220]], ['uuml', [252]], ['uwangle', [10663]], ['vangrt', [10652]], ['varepsilon', [1013]], ['varkappa', [1008]], ['varnothing', [8709]], ['varphi', [981]], ['varpi', [982]], ['varpropto', [8733]], ['varr', [8597]], ['vArr', [8661]], ['varrho', [1009]], ['varsigma', [962]], ['varsubsetneq', [8842, 65024]], ['varsubsetneqq', [10955, 65024]], ['varsupsetneq', [8843, 65024]], ['varsupsetneqq', [10956, 65024]], ['vartheta', [977]], ['vartriangleleft', [8882]], ['vartriangleright', [8883]], ['vBar', [10984]], ['Vbar', [10987]], ['vBarv', [10985]], ['Vcy', [1042]], ['vcy', [1074]], ['vdash', [8866]], ['vDash', [8872]], ['Vdash', [8873]], ['VDash', [8875]], ['Vdashl', [10982]], ['veebar', [8891]], ['vee', [8744]], ['Vee', [8897]], ['veeeq', [8794]], ['vellip', [8942]], ['verbar', [124]], ['Verbar', [8214]], ['vert', [124]], ['Vert', [8214]], ['VerticalBar', [8739]], ['VerticalLine', [124]], ['VerticalSeparator', [10072]], ['VerticalTilde', [8768]], ['VeryThinSpace', [8202]], ['Vfr', [120089]], ['vfr', [120115]], ['vltri', [8882]], ['vnsub', [8834, 8402]], ['vnsup', [8835, 8402]], ['Vopf', [120141]], ['vopf', [120167]], ['vprop', [8733]], ['vrtri', [8883]], ['Vscr', [119985]], ['vscr', [120011]], ['vsubnE', [10955, 65024]], ['vsubne', [8842, 65024]], ['vsupnE', [10956, 65024]], ['vsupne', [8843, 65024]], ['Vvdash', [8874]], ['vzigzag', [10650]], ['Wcirc', [372]], ['wcirc', [373]], ['wedbar', [10847]], ['wedge', [8743]], ['Wedge', [8896]], ['wedgeq', [8793]], ['weierp', [8472]], ['Wfr', [120090]], ['wfr', [120116]], ['Wopf', [120142]], ['wopf', [120168]], ['wp', [8472]], ['wr', [8768]], ['wreath', [8768]], ['Wscr', [119986]], ['wscr', [120012]], ['xcap', [8898]], ['xcirc', [9711]], ['xcup', [8899]], ['xdtri', [9661]], ['Xfr', [120091]], ['xfr', [120117]], ['xharr', [10231]], ['xhArr', [10234]], ['Xi', [926]], ['xi', [958]], ['xlarr', [10229]], ['xlArr', [10232]], ['xmap', [10236]], ['xnis', [8955]], ['xodot', [10752]], ['Xopf', [120143]], ['xopf', [120169]], ['xoplus', [10753]], ['xotime', [10754]], ['xrarr', [10230]], ['xrArr', [10233]], ['Xscr', [119987]], ['xscr', [120013]], ['xsqcup', [10758]], ['xuplus', [10756]], ['xutri', [9651]], ['xvee', [8897]], ['xwedge', [8896]], ['Yacute', [221]], ['yacute', [253]], ['YAcy', [1071]], ['yacy', [1103]], ['Ycirc', [374]], ['ycirc', [375]], ['Ycy', [1067]], ['ycy', [1099]], ['yen', [165]], ['Yfr', [120092]], ['yfr', [120118]], ['YIcy', [1031]], ['yicy', [1111]], ['Yopf', [120144]], ['yopf', [120170]], ['Yscr', [119988]], ['yscr', [120014]], ['YUcy', [1070]], ['yucy', [1102]], ['yuml', [255]], ['Yuml', [376]], ['Zacute', [377]], ['zacute', [378]], ['Zcaron', [381]], ['zcaron', [382]], ['Zcy', [1047]], ['zcy', [1079]], ['Zdot', [379]], ['zdot', [380]], ['zeetrf', [8488]], ['ZeroWidthSpace', [8203]], ['Zeta', [918]], ['zeta', [950]], ['zfr', [120119]], ['Zfr', [8488]], ['ZHcy', [1046]], ['zhcy', [1078]], ['zigrarr', [8669]], ['zopf', [120171]], ['Zopf', [8484]], ['Zscr', [119989]], ['zscr', [120015]], ['zwj', [8205]], ['zwnj', [8204]]];

var alphaIndex = {};
var charIndex = {};

createIndexes(alphaIndex, charIndex);

/**
 * @constructor
 */
function Html5Entities() {}

/**
 * @param {String} str
 * @returns {String}
 */
Html5Entities.prototype.decode = function(str) {
    if (!str || !str.length) {
        return '';
    }
    return str.replace(/&(#?[\w\d]+);?/g, function(s, entity) {
        var chr;
        if (entity.charAt(0) === "#") {
            var code = entity.charAt(1) === 'x' ?
                parseInt(entity.substr(2).toLowerCase(), 16) :
                parseInt(entity.substr(1));

            if (!(isNaN(code) || code < -32768 || code > 65535)) {
                chr = String.fromCharCode(code);
            }
        } else {
            chr = alphaIndex[entity];
        }
        return chr || s;
    });
};

/**
 * @param {String} str
 * @returns {String}
 */
 Html5Entities.decode = function(str) {
    return new Html5Entities().decode(str);
 };

/**
 * @param {String} str
 * @returns {String}
 */
Html5Entities.prototype.encode = function(str) {
    if (!str || !str.length) {
        return '';
    }
    var strLength = str.length;
    var result = '';
    var i = 0;
    while (i < strLength) {
        var charInfo = charIndex[str.charCodeAt(i)];
        if (charInfo) {
            var alpha = charInfo[str.charCodeAt(i + 1)];
            if (alpha) {
                i++;
            } else {
                alpha = charInfo[''];
            }
            if (alpha) {
                result += "&" + alpha + ";";
                i++;
                continue;
            }
        }
        result += str.charAt(i);
        i++;
    }
    return result;
};

/**
 * @param {String} str
 * @returns {String}
 */
 Html5Entities.encode = function(str) {
    return new Html5Entities().encode(str);
 };

/**
 * @param {String} str
 * @returns {String}
 */
Html5Entities.prototype.encodeNonUTF = function(str) {
    if (!str || !str.length) {
        return '';
    }
    var strLength = str.length;
    var result = '';
    var i = 0;
    while (i < strLength) {
        var c = str.charCodeAt(i);
        var charInfo = charIndex[c];
        if (charInfo) {
            var alpha = charInfo[str.charCodeAt(i + 1)];
            if (alpha) {
                i++;
            } else {
                alpha = charInfo[''];
            }
            if (alpha) {
                result += "&" + alpha + ";";
                i++;
                continue;
            }
        }
        if (c < 32 || c > 126) {
            result += '&#' + c + ';';
        } else {
            result += str.charAt(i);
        }
        i++;
    }
    return result;
};

/**
 * @param {String} str
 * @returns {String}
 */
 Html5Entities.encodeNonUTF = function(str) {
    return new Html5Entities().encodeNonUTF(str);
 };

/**
 * @param {String} str
 * @returns {String}
 */
Html5Entities.prototype.encodeNonASCII = function(str) {
    if (!str || !str.length) {
        return '';
    }
    var strLength = str.length;
    var result = '';
    var i = 0;
    while (i < strLength) {
        var c = str.charCodeAt(i);
        if (c <= 255) {
            result += str[i++];
            continue;
        }
        result += '&#' + c + ';';
        i++
    }
    return result;
};

/**
 * @param {String} str
 * @returns {String}
 */
 Html5Entities.encodeNonASCII = function(str) {
    return new Html5Entities().encodeNonASCII(str);
 };

/**
 * @param {Object} alphaIndex Passed by reference.
 * @param {Object} charIndex Passed by reference.
 */
function createIndexes(alphaIndex, charIndex) {
    var i = ENTITIES.length;
    var _results = [];
    while (i--) {
        var e = ENTITIES[i];
        var alpha = e[0];
        var chars = e[1];
        var chr = chars[0];
        var addChar = (chr < 32 || chr > 126) || chr === 62 || chr === 60 || chr === 38 || chr === 34 || chr === 39;
        var charInfo;
        if (addChar) {
            charInfo = charIndex[chr] = charIndex[chr] || {};
        }
        if (chars[1]) {
            var chr2 = chars[1];
            alphaIndex[alpha] = String.fromCharCode(chr) + String.fromCharCode(chr2);
            _results.push(addChar && (charInfo[chr2] = alpha));
        } else {
            alphaIndex[alpha] = String.fromCharCode(chr);
            _results.push(addChar && (charInfo[''] = alpha));
        }
    }
}

module.exports = Html5Entities;

},{}],7:[function(_dereq_,module,exports){
var ALPHA_INDEX = {
    '&lt': '<',
    '&gt': '>',
    '&quot': '"',
    '&apos': '\'',
    '&amp': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': '\'',
    '&amp;': '&'
};

var CHAR_INDEX = {
    60: 'lt',
    62: 'gt',
    34: 'quot',
    39: 'apos',
    38: 'amp'
};

var CHAR_S_INDEX = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&apos;',
    '&': '&amp;'
};

/**
 * @constructor
 */
function XmlEntities() {}

/**
 * @param {String} str
 * @returns {String}
 */
XmlEntities.prototype.encode = function(str) {
    if (!str || !str.length) {
        return '';
    }
    return str.replace(/<|>|"|'|&/g, function(s) {
        return CHAR_S_INDEX[s];
    });
};

/**
 * @param {String} str
 * @returns {String}
 */
 XmlEntities.encode = function(str) {
    return new XmlEntities().encode(str);
 };

/**
 * @param {String} str
 * @returns {String}
 */
XmlEntities.prototype.decode = function(str) {
    if (!str || !str.length) {
        return '';
    }
    return str.replace(/&#?[0-9a-zA-Z]+;?/g, function(s) {
        if (s.charAt(1) === '#') {
            var code = s.charAt(2).toLowerCase() === 'x' ?
                parseInt(s.substr(3), 16) :
                parseInt(s.substr(2));

            if (isNaN(code) || code < -32768 || code > 65535) {
                return '';
            }
            return String.fromCharCode(code);
        }
        return ALPHA_INDEX[s] || s;
    });
};

/**
 * @param {String} str
 * @returns {String}
 */
 XmlEntities.decode = function(str) {
    return new XmlEntities().decode(str);
 };

/**
 * @param {String} str
 * @returns {String}
 */
XmlEntities.prototype.encodeNonUTF = function(str) {
    if (!str || !str.length) {
        return '';
    }
    var strLength = str.length;
    var result = '';
    var i = 0;
    while (i < strLength) {
        var c = str.charCodeAt(i);
        var alpha = CHAR_INDEX[c];
        if (alpha) {
            result += "&" + alpha + ";";
            i++;
            continue;
        }
        if (c < 32 || c > 126) {
            result += '&#' + c + ';';
        } else {
            result += str.charAt(i);
        }
        i++;
    }
    return result;
};

/**
 * @param {String} str
 * @returns {String}
 */
 XmlEntities.encodeNonUTF = function(str) {
    return new XmlEntities().encodeNonUTF(str);
 };

/**
 * @param {String} str
 * @returns {String}
 */
XmlEntities.prototype.encodeNonASCII = function(str) {
    if (!str || !str.length) {
        return '';
    }
    var strLenght = str.length;
    var result = '';
    var i = 0;
    while (i < strLenght) {
        var c = str.charCodeAt(i);
        if (c <= 255) {
            result += str[i++];
            continue;
        }
        result += '&#' + c + ';';
        i++;
    }
    return result;
};

/**
 * @param {String} str
 * @returns {String}
 */
 XmlEntities.encodeNonASCII = function(str) {
    return new XmlEntities().encodeNonASCII(str);
 };

module.exports = XmlEntities;

},{}],8:[function(_dereq_,module,exports){
(function (global){
/*!
    localForage -- Offline Storage, Improved
    Version 1.7.3
    https://localforage.github.io/localForage
    (c) 2013-2017 Mozilla, Apache License 2.0
*/
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.localforage = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof _dereq_=="function"&&_dereq_;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw (f.code="MODULE_NOT_FOUND", f)}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof _dereq_=="function"&&_dereq_;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
(function (global){
'use strict';
var Mutation = global.MutationObserver || global.WebKitMutationObserver;

var scheduleDrain;

{
  if (Mutation) {
    var called = 0;
    var observer = new Mutation(nextTick);
    var element = global.document.createTextNode('');
    observer.observe(element, {
      characterData: true
    });
    scheduleDrain = function () {
      element.data = (called = ++called % 2);
    };
  } else if (!global.setImmediate && typeof global.MessageChannel !== 'undefined') {
    var channel = new global.MessageChannel();
    channel.port1.onmessage = nextTick;
    scheduleDrain = function () {
      channel.port2.postMessage(0);
    };
  } else if ('document' in global && 'onreadystatechange' in global.document.createElement('script')) {
    scheduleDrain = function () {

      // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
      // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
      var scriptEl = global.document.createElement('script');
      scriptEl.onreadystatechange = function () {
        nextTick();

        scriptEl.onreadystatechange = null;
        scriptEl.parentNode.removeChild(scriptEl);
        scriptEl = null;
      };
      global.document.documentElement.appendChild(scriptEl);
    };
  } else {
    scheduleDrain = function () {
      setTimeout(nextTick, 0);
    };
  }
}

var draining;
var queue = [];
//named nextTick for less confusing stack traces
function nextTick() {
  draining = true;
  var i, oldQueue;
  var len = queue.length;
  while (len) {
    oldQueue = queue;
    queue = [];
    i = -1;
    while (++i < len) {
      oldQueue[i]();
    }
    len = queue.length;
  }
  draining = false;
}

module.exports = immediate;
function immediate(task) {
  if (queue.push(task) === 1 && !draining) {
    scheduleDrain();
  }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(_dereq_,module,exports){
'use strict';
var immediate = _dereq_(1);

/* istanbul ignore next */
function INTERNAL() {}

var handlers = {};

var REJECTED = ['REJECTED'];
var FULFILLED = ['FULFILLED'];
var PENDING = ['PENDING'];

module.exports = Promise;

function Promise(resolver) {
  if (typeof resolver !== 'function') {
    throw new TypeError('resolver must be a function');
  }
  this.state = PENDING;
  this.queue = [];
  this.outcome = void 0;
  if (resolver !== INTERNAL) {
    safelyResolveThenable(this, resolver);
  }
}

Promise.prototype["catch"] = function (onRejected) {
  return this.then(null, onRejected);
};
Promise.prototype.then = function (onFulfilled, onRejected) {
  if (typeof onFulfilled !== 'function' && this.state === FULFILLED ||
    typeof onRejected !== 'function' && this.state === REJECTED) {
    return this;
  }
  var promise = new this.constructor(INTERNAL);
  if (this.state !== PENDING) {
    var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
    unwrap(promise, resolver, this.outcome);
  } else {
    this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
  }

  return promise;
};
function QueueItem(promise, onFulfilled, onRejected) {
  this.promise = promise;
  if (typeof onFulfilled === 'function') {
    this.onFulfilled = onFulfilled;
    this.callFulfilled = this.otherCallFulfilled;
  }
  if (typeof onRejected === 'function') {
    this.onRejected = onRejected;
    this.callRejected = this.otherCallRejected;
  }
}
QueueItem.prototype.callFulfilled = function (value) {
  handlers.resolve(this.promise, value);
};
QueueItem.prototype.otherCallFulfilled = function (value) {
  unwrap(this.promise, this.onFulfilled, value);
};
QueueItem.prototype.callRejected = function (value) {
  handlers.reject(this.promise, value);
};
QueueItem.prototype.otherCallRejected = function (value) {
  unwrap(this.promise, this.onRejected, value);
};

function unwrap(promise, func, value) {
  immediate(function () {
    var returnValue;
    try {
      returnValue = func(value);
    } catch (e) {
      return handlers.reject(promise, e);
    }
    if (returnValue === promise) {
      handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
    } else {
      handlers.resolve(promise, returnValue);
    }
  });
}

handlers.resolve = function (self, value) {
  var result = tryCatch(getThen, value);
  if (result.status === 'error') {
    return handlers.reject(self, result.value);
  }
  var thenable = result.value;

  if (thenable) {
    safelyResolveThenable(self, thenable);
  } else {
    self.state = FULFILLED;
    self.outcome = value;
    var i = -1;
    var len = self.queue.length;
    while (++i < len) {
      self.queue[i].callFulfilled(value);
    }
  }
  return self;
};
handlers.reject = function (self, error) {
  self.state = REJECTED;
  self.outcome = error;
  var i = -1;
  var len = self.queue.length;
  while (++i < len) {
    self.queue[i].callRejected(error);
  }
  return self;
};

function getThen(obj) {
  // Make sure we only access the accessor once as required by the spec
  var then = obj && obj.then;
  if (obj && (typeof obj === 'object' || typeof obj === 'function') && typeof then === 'function') {
    return function appyThen() {
      then.apply(obj, arguments);
    };
  }
}

function safelyResolveThenable(self, thenable) {
  // Either fulfill, reject or reject with error
  var called = false;
  function onError(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.reject(self, value);
  }

  function onSuccess(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.resolve(self, value);
  }

  function tryToUnwrap() {
    thenable(onSuccess, onError);
  }

  var result = tryCatch(tryToUnwrap);
  if (result.status === 'error') {
    onError(result.value);
  }
}

function tryCatch(func, value) {
  var out = {};
  try {
    out.value = func(value);
    out.status = 'success';
  } catch (e) {
    out.status = 'error';
    out.value = e;
  }
  return out;
}

Promise.resolve = resolve;
function resolve(value) {
  if (value instanceof this) {
    return value;
  }
  return handlers.resolve(new this(INTERNAL), value);
}

Promise.reject = reject;
function reject(reason) {
  var promise = new this(INTERNAL);
  return handlers.reject(promise, reason);
}

Promise.all = all;
function all(iterable) {
  var self = this;
  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    return this.reject(new TypeError('must be an array'));
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return this.resolve([]);
  }

  var values = new Array(len);
  var resolved = 0;
  var i = -1;
  var promise = new this(INTERNAL);

  while (++i < len) {
    allResolver(iterable[i], i);
  }
  return promise;
  function allResolver(value, i) {
    self.resolve(value).then(resolveFromAll, function (error) {
      if (!called) {
        called = true;
        handlers.reject(promise, error);
      }
    });
    function resolveFromAll(outValue) {
      values[i] = outValue;
      if (++resolved === len && !called) {
        called = true;
        handlers.resolve(promise, values);
      }
    }
  }
}

Promise.race = race;
function race(iterable) {
  var self = this;
  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    return this.reject(new TypeError('must be an array'));
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return this.resolve([]);
  }

  var i = -1;
  var promise = new this(INTERNAL);

  while (++i < len) {
    resolver(iterable[i]);
  }
  return promise;
  function resolver(value) {
    self.resolve(value).then(function (response) {
      if (!called) {
        called = true;
        handlers.resolve(promise, response);
      }
    }, function (error) {
      if (!called) {
        called = true;
        handlers.reject(promise, error);
      }
    });
  }
}

},{"1":1}],3:[function(_dereq_,module,exports){
(function (global){
'use strict';
if (typeof global.Promise !== 'function') {
  global.Promise = _dereq_(2);
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"2":2}],4:[function(_dereq_,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function getIDB() {
    /* global indexedDB,webkitIndexedDB,mozIndexedDB,OIndexedDB,msIndexedDB */
    try {
        if (typeof indexedDB !== 'undefined') {
            return indexedDB;
        }
        if (typeof webkitIndexedDB !== 'undefined') {
            return webkitIndexedDB;
        }
        if (typeof mozIndexedDB !== 'undefined') {
            return mozIndexedDB;
        }
        if (typeof OIndexedDB !== 'undefined') {
            return OIndexedDB;
        }
        if (typeof msIndexedDB !== 'undefined') {
            return msIndexedDB;
        }
    } catch (e) {
        return;
    }
}

var idb = getIDB();

function isIndexedDBValid() {
    try {
        // Initialize IndexedDB; fall back to vendor-prefixed versions
        // if needed.
        if (!idb) {
            return false;
        }
        // We mimic PouchDB here;
        //
        // We test for openDatabase because IE Mobile identifies itself
        // as Safari. Oh the lulz...
        var isSafari = typeof openDatabase !== 'undefined' && /(Safari|iPhone|iPad|iPod)/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) && !/BlackBerry/.test(navigator.platform);

        var hasFetch = typeof fetch === 'function' && fetch.toString().indexOf('[native code') !== -1;

        // Safari <10.1 does not meet our requirements for IDB support (#5572)
        // since Safari 10.1 shipped with fetch, we can use that to detect it
        return (!isSafari || hasFetch) && typeof indexedDB !== 'undefined' &&
        // some outdated implementations of IDB that appear on Samsung
        // and HTC Android devices <4.4 are missing IDBKeyRange
        // See: https://github.com/mozilla/localForage/issues/128
        // See: https://github.com/mozilla/localForage/issues/272
        typeof IDBKeyRange !== 'undefined';
    } catch (e) {
        return false;
    }
}

// Abstracts constructing a Blob object, so it also works in older
// browsers that don't support the native Blob constructor. (i.e.
// old QtWebKit versions, at least).
// Abstracts constructing a Blob object, so it also works in older
// browsers that don't support the native Blob constructor. (i.e.
// old QtWebKit versions, at least).
function createBlob(parts, properties) {
    /* global BlobBuilder,MSBlobBuilder,MozBlobBuilder,WebKitBlobBuilder */
    parts = parts || [];
    properties = properties || {};
    try {
        return new Blob(parts, properties);
    } catch (e) {
        if (e.name !== 'TypeError') {
            throw e;
        }
        var Builder = typeof BlobBuilder !== 'undefined' ? BlobBuilder : typeof MSBlobBuilder !== 'undefined' ? MSBlobBuilder : typeof MozBlobBuilder !== 'undefined' ? MozBlobBuilder : WebKitBlobBuilder;
        var builder = new Builder();
        for (var i = 0; i < parts.length; i += 1) {
            builder.append(parts[i]);
        }
        return builder.getBlob(properties.type);
    }
}

// This is CommonJS because lie is an external dependency, so Rollup
// can just ignore it.
if (typeof Promise === 'undefined') {
    // In the "nopromises" build this will just throw if you don't have
    // a global promise object, but it would throw anyway later.
    _dereq_(3);
}
var Promise$1 = Promise;

function executeCallback(promise, callback) {
    if (callback) {
        promise.then(function (result) {
            callback(null, result);
        }, function (error) {
            callback(error);
        });
    }
}

function executeTwoCallbacks(promise, callback, errorCallback) {
    if (typeof callback === 'function') {
        promise.then(callback);
    }

    if (typeof errorCallback === 'function') {
        promise["catch"](errorCallback);
    }
}

function normalizeKey(key) {
    // Cast the key to a string, as that's all we can set as a key.
    if (typeof key !== 'string') {
        console.warn(key + ' used as a key, but it is not a string.');
        key = String(key);
    }

    return key;
}

function getCallback() {
    if (arguments.length && typeof arguments[arguments.length - 1] === 'function') {
        return arguments[arguments.length - 1];
    }
}

// Some code originally from async_storage.js in
// [Gaia](https://github.com/mozilla-b2g/gaia).

var DETECT_BLOB_SUPPORT_STORE = 'local-forage-detect-blob-support';
var supportsBlobs = void 0;
var dbContexts = {};
var toString = Object.prototype.toString;

// Transaction Modes
var READ_ONLY = 'readonly';
var READ_WRITE = 'readwrite';

// Transform a binary string to an array buffer, because otherwise
// weird stuff happens when you try to work with the binary string directly.
// It is known.
// From http://stackoverflow.com/questions/14967647/ (continues on next line)
// encode-decode-image-with-base64-breaks-image (2013-04-21)
function _binStringToArrayBuffer(bin) {
    var length = bin.length;
    var buf = new ArrayBuffer(length);
    var arr = new Uint8Array(buf);
    for (var i = 0; i < length; i++) {
        arr[i] = bin.charCodeAt(i);
    }
    return buf;
}

//
// Blobs are not supported in all versions of IndexedDB, notably
// Chrome <37 and Android <5. In those versions, storing a blob will throw.
//
// Various other blob bugs exist in Chrome v37-42 (inclusive).
// Detecting them is expensive and confusing to users, and Chrome 37-42
// is at very low usage worldwide, so we do a hacky userAgent check instead.
//
// content-type bug: https://code.google.com/p/chromium/issues/detail?id=408120
// 404 bug: https://code.google.com/p/chromium/issues/detail?id=447916
// FileReader bug: https://code.google.com/p/chromium/issues/detail?id=447836
//
// Code borrowed from PouchDB. See:
// https://github.com/pouchdb/pouchdb/blob/master/packages/node_modules/pouchdb-adapter-idb/src/blobSupport.js
//
function _checkBlobSupportWithoutCaching(idb) {
    return new Promise$1(function (resolve) {
        var txn = idb.transaction(DETECT_BLOB_SUPPORT_STORE, READ_WRITE);
        var blob = createBlob(['']);
        txn.objectStore(DETECT_BLOB_SUPPORT_STORE).put(blob, 'key');

        txn.onabort = function (e) {
            // If the transaction aborts now its due to not being able to
            // write to the database, likely due to the disk being full
            e.preventDefault();
            e.stopPropagation();
            resolve(false);
        };

        txn.oncomplete = function () {
            var matchedChrome = navigator.userAgent.match(/Chrome\/(\d+)/);
            var matchedEdge = navigator.userAgent.match(/Edge\//);
            // MS Edge pretends to be Chrome 42:
            // https://msdn.microsoft.com/en-us/library/hh869301%28v=vs.85%29.aspx
            resolve(matchedEdge || !matchedChrome || parseInt(matchedChrome[1], 10) >= 43);
        };
    })["catch"](function () {
        return false; // error, so assume unsupported
    });
}

function _checkBlobSupport(idb) {
    if (typeof supportsBlobs === 'boolean') {
        return Promise$1.resolve(supportsBlobs);
    }
    return _checkBlobSupportWithoutCaching(idb).then(function (value) {
        supportsBlobs = value;
        return supportsBlobs;
    });
}

function _deferReadiness(dbInfo) {
    var dbContext = dbContexts[dbInfo.name];

    // Create a deferred object representing the current database operation.
    var deferredOperation = {};

    deferredOperation.promise = new Promise$1(function (resolve, reject) {
        deferredOperation.resolve = resolve;
        deferredOperation.reject = reject;
    });

    // Enqueue the deferred operation.
    dbContext.deferredOperations.push(deferredOperation);

    // Chain its promise to the database readiness.
    if (!dbContext.dbReady) {
        dbContext.dbReady = deferredOperation.promise;
    } else {
        dbContext.dbReady = dbContext.dbReady.then(function () {
            return deferredOperation.promise;
        });
    }
}

function _advanceReadiness(dbInfo) {
    var dbContext = dbContexts[dbInfo.name];

    // Dequeue a deferred operation.
    var deferredOperation = dbContext.deferredOperations.pop();

    // Resolve its promise (which is part of the database readiness
    // chain of promises).
    if (deferredOperation) {
        deferredOperation.resolve();
        return deferredOperation.promise;
    }
}

function _rejectReadiness(dbInfo, err) {
    var dbContext = dbContexts[dbInfo.name];

    // Dequeue a deferred operation.
    var deferredOperation = dbContext.deferredOperations.pop();

    // Reject its promise (which is part of the database readiness
    // chain of promises).
    if (deferredOperation) {
        deferredOperation.reject(err);
        return deferredOperation.promise;
    }
}

function _getConnection(dbInfo, upgradeNeeded) {
    return new Promise$1(function (resolve, reject) {
        dbContexts[dbInfo.name] = dbContexts[dbInfo.name] || createDbContext();

        if (dbInfo.db) {
            if (upgradeNeeded) {
                _deferReadiness(dbInfo);
                dbInfo.db.close();
            } else {
                return resolve(dbInfo.db);
            }
        }

        var dbArgs = [dbInfo.name];

        if (upgradeNeeded) {
            dbArgs.push(dbInfo.version);
        }

        var openreq = idb.open.apply(idb, dbArgs);

        if (upgradeNeeded) {
            openreq.onupgradeneeded = function (e) {
                var db = openreq.result;
                try {
                    db.createObjectStore(dbInfo.storeName);
                    if (e.oldVersion <= 1) {
                        // Added when support for blob shims was added
                        db.createObjectStore(DETECT_BLOB_SUPPORT_STORE);
                    }
                } catch (ex) {
                    if (ex.name === 'ConstraintError') {
                        console.warn('The database "' + dbInfo.name + '"' + ' has been upgraded from version ' + e.oldVersion + ' to version ' + e.newVersion + ', but the storage "' + dbInfo.storeName + '" already exists.');
                    } else {
                        throw ex;
                    }
                }
            };
        }

        openreq.onerror = function (e) {
            e.preventDefault();
            reject(openreq.error);
        };

        openreq.onsuccess = function () {
            resolve(openreq.result);
            _advanceReadiness(dbInfo);
        };
    });
}

function _getOriginalConnection(dbInfo) {
    return _getConnection(dbInfo, false);
}

function _getUpgradedConnection(dbInfo) {
    return _getConnection(dbInfo, true);
}

function _isUpgradeNeeded(dbInfo, defaultVersion) {
    if (!dbInfo.db) {
        return true;
    }

    var isNewStore = !dbInfo.db.objectStoreNames.contains(dbInfo.storeName);
    var isDowngrade = dbInfo.version < dbInfo.db.version;
    var isUpgrade = dbInfo.version > dbInfo.db.version;

    if (isDowngrade) {
        // If the version is not the default one
        // then warn for impossible downgrade.
        if (dbInfo.version !== defaultVersion) {
            console.warn('The database "' + dbInfo.name + '"' + " can't be downgraded from version " + dbInfo.db.version + ' to version ' + dbInfo.version + '.');
        }
        // Align the versions to prevent errors.
        dbInfo.version = dbInfo.db.version;
    }

    if (isUpgrade || isNewStore) {
        // If the store is new then increment the version (if needed).
        // This will trigger an "upgradeneeded" event which is required
        // for creating a store.
        if (isNewStore) {
            var incVersion = dbInfo.db.version + 1;
            if (incVersion > dbInfo.version) {
                dbInfo.version = incVersion;
            }
        }

        return true;
    }

    return false;
}

// encode a blob for indexeddb engines that don't support blobs
function _encodeBlob(blob) {
    return new Promise$1(function (resolve, reject) {
        var reader = new FileReader();
        reader.onerror = reject;
        reader.onloadend = function (e) {
            var base64 = btoa(e.target.result || '');
            resolve({
                __local_forage_encoded_blob: true,
                data: base64,
                type: blob.type
            });
        };
        reader.readAsBinaryString(blob);
    });
}

// decode an encoded blob
function _decodeBlob(encodedBlob) {
    var arrayBuff = _binStringToArrayBuffer(atob(encodedBlob.data));
    return createBlob([arrayBuff], { type: encodedBlob.type });
}

// is this one of our fancy encoded blobs?
function _isEncodedBlob(value) {
    return value && value.__local_forage_encoded_blob;
}

// Specialize the default `ready()` function by making it dependent
// on the current database operations. Thus, the driver will be actually
// ready when it's been initialized (default) *and* there are no pending
// operations on the database (initiated by some other instances).
function _fullyReady(callback) {
    var self = this;

    var promise = self._initReady().then(function () {
        var dbContext = dbContexts[self._dbInfo.name];

        if (dbContext && dbContext.dbReady) {
            return dbContext.dbReady;
        }
    });

    executeTwoCallbacks(promise, callback, callback);
    return promise;
}

// Try to establish a new db connection to replace the
// current one which is broken (i.e. experiencing
// InvalidStateError while creating a transaction).
function _tryReconnect(dbInfo) {
    _deferReadiness(dbInfo);

    var dbContext = dbContexts[dbInfo.name];
    var forages = dbContext.forages;

    for (var i = 0; i < forages.length; i++) {
        var forage = forages[i];
        if (forage._dbInfo.db) {
            forage._dbInfo.db.close();
            forage._dbInfo.db = null;
        }
    }
    dbInfo.db = null;

    return _getOriginalConnection(dbInfo).then(function (db) {
        dbInfo.db = db;
        if (_isUpgradeNeeded(dbInfo)) {
            // Reopen the database for upgrading.
            return _getUpgradedConnection(dbInfo);
        }
        return db;
    }).then(function (db) {
        // store the latest db reference
        // in case the db was upgraded
        dbInfo.db = dbContext.db = db;
        for (var i = 0; i < forages.length; i++) {
            forages[i]._dbInfo.db = db;
        }
    })["catch"](function (err) {
        _rejectReadiness(dbInfo, err);
        throw err;
    });
}

// FF doesn't like Promises (micro-tasks) and IDDB store operations,
// so we have to do it with callbacks
function createTransaction(dbInfo, mode, callback, retries) {
    if (retries === undefined) {
        retries = 1;
    }

    try {
        var tx = dbInfo.db.transaction(dbInfo.storeName, mode);
        callback(null, tx);
    } catch (err) {
        if (retries > 0 && (!dbInfo.db || err.name === 'InvalidStateError' || err.name === 'NotFoundError')) {
            return Promise$1.resolve().then(function () {
                if (!dbInfo.db || err.name === 'NotFoundError' && !dbInfo.db.objectStoreNames.contains(dbInfo.storeName) && dbInfo.version <= dbInfo.db.version) {
                    // increase the db version, to create the new ObjectStore
                    if (dbInfo.db) {
                        dbInfo.version = dbInfo.db.version + 1;
                    }
                    // Reopen the database for upgrading.
                    return _getUpgradedConnection(dbInfo);
                }
            }).then(function () {
                return _tryReconnect(dbInfo).then(function () {
                    createTransaction(dbInfo, mode, callback, retries - 1);
                });
            })["catch"](callback);
        }

        callback(err);
    }
}

function createDbContext() {
    return {
        // Running localForages sharing a database.
        forages: [],
        // Shared database.
        db: null,
        // Database readiness (promise).
        dbReady: null,
        // Deferred operations on the database.
        deferredOperations: []
    };
}

// Open the IndexedDB database (automatically creates one if one didn't
// previously exist), using any options set in the config.
function _initStorage(options) {
    var self = this;
    var dbInfo = {
        db: null
    };

    if (options) {
        for (var i in options) {
            dbInfo[i] = options[i];
        }
    }

    // Get the current context of the database;
    var dbContext = dbContexts[dbInfo.name];

    // ...or create a new context.
    if (!dbContext) {
        dbContext = createDbContext();
        // Register the new context in the global container.
        dbContexts[dbInfo.name] = dbContext;
    }

    // Register itself as a running localForage in the current context.
    dbContext.forages.push(self);

    // Replace the default `ready()` function with the specialized one.
    if (!self._initReady) {
        self._initReady = self.ready;
        self.ready = _fullyReady;
    }

    // Create an array of initialization states of the related localForages.
    var initPromises = [];

    function ignoreErrors() {
        // Don't handle errors here,
        // just makes sure related localForages aren't pending.
        return Promise$1.resolve();
    }

    for (var j = 0; j < dbContext.forages.length; j++) {
        var forage = dbContext.forages[j];
        if (forage !== self) {
            // Don't wait for itself...
            initPromises.push(forage._initReady()["catch"](ignoreErrors));
        }
    }

    // Take a snapshot of the related localForages.
    var forages = dbContext.forages.slice(0);

    // Initialize the connection process only when
    // all the related localForages aren't pending.
    return Promise$1.all(initPromises).then(function () {
        dbInfo.db = dbContext.db;
        // Get the connection or open a new one without upgrade.
        return _getOriginalConnection(dbInfo);
    }).then(function (db) {
        dbInfo.db = db;
        if (_isUpgradeNeeded(dbInfo, self._defaultConfig.version)) {
            // Reopen the database for upgrading.
            return _getUpgradedConnection(dbInfo);
        }
        return db;
    }).then(function (db) {
        dbInfo.db = dbContext.db = db;
        self._dbInfo = dbInfo;
        // Share the final connection amongst related localForages.
        for (var k = 0; k < forages.length; k++) {
            var forage = forages[k];
            if (forage !== self) {
                // Self is already up-to-date.
                forage._dbInfo.db = dbInfo.db;
                forage._dbInfo.version = dbInfo.version;
            }
        }
    });
}

function getItem(key, callback) {
    var self = this;

    key = normalizeKey(key);

    var promise = new Promise$1(function (resolve, reject) {
        self.ready().then(function () {
            createTransaction(self._dbInfo, READ_ONLY, function (err, transaction) {
                if (err) {
                    return reject(err);
                }

                try {
                    var store = transaction.objectStore(self._dbInfo.storeName);
                    var req = store.get(key);

                    req.onsuccess = function () {
                        var value = req.result;
                        if (value === undefined) {
                            value = null;
                        }
                        if (_isEncodedBlob(value)) {
                            value = _decodeBlob(value);
                        }
                        resolve(value);
                    };

                    req.onerror = function () {
                        reject(req.error);
                    };
                } catch (e) {
                    reject(e);
                }
            });
        })["catch"](reject);
    });

    executeCallback(promise, callback);
    return promise;
}

// Iterate over all items stored in database.
function iterate(iterator, callback) {
    var self = this;

    var promise = new Promise$1(function (resolve, reject) {
        self.ready().then(function () {
            createTransaction(self._dbInfo, READ_ONLY, function (err, transaction) {
                if (err) {
                    return reject(err);
                }

                try {
                    var store = transaction.objectStore(self._dbInfo.storeName);
                    var req = store.openCursor();
                    var iterationNumber = 1;

                    req.onsuccess = function () {
                        var cursor = req.result;

                        if (cursor) {
                            var value = cursor.value;
                            if (_isEncodedBlob(value)) {
                                value = _decodeBlob(value);
                            }
                            var result = iterator(value, cursor.key, iterationNumber++);

                            // when the iterator callback retuns any
                            // (non-`undefined`) value, then we stop
                            // the iteration immediately
                            if (result !== void 0) {
                                resolve(result);
                            } else {
                                cursor["continue"]();
                            }
                        } else {
                            resolve();
                        }
                    };

                    req.onerror = function () {
                        reject(req.error);
                    };
                } catch (e) {
                    reject(e);
                }
            });
        })["catch"](reject);
    });

    executeCallback(promise, callback);

    return promise;
}

function setItem(key, value, callback) {
    var self = this;

    key = normalizeKey(key);

    var promise = new Promise$1(function (resolve, reject) {
        var dbInfo;
        self.ready().then(function () {
            dbInfo = self._dbInfo;
            if (toString.call(value) === '[object Blob]') {
                return _checkBlobSupport(dbInfo.db).then(function (blobSupport) {
                    if (blobSupport) {
                        return value;
                    }
                    return _encodeBlob(value);
                });
            }
            return value;
        }).then(function (value) {
            createTransaction(self._dbInfo, READ_WRITE, function (err, transaction) {
                if (err) {
                    return reject(err);
                }

                try {
                    var store = transaction.objectStore(self._dbInfo.storeName);

                    // The reason we don't _save_ null is because IE 10 does
                    // not support saving the `null` type in IndexedDB. How
                    // ironic, given the bug below!
                    // See: https://github.com/mozilla/localForage/issues/161
                    if (value === null) {
                        value = undefined;
                    }

                    var req = store.put(value, key);

                    transaction.oncomplete = function () {
                        // Cast to undefined so the value passed to
                        // callback/promise is the same as what one would get out
                        // of `getItem()` later. This leads to some weirdness
                        // (setItem('foo', undefined) will return `null`), but
                        // it's not my fault localStorage is our baseline and that
                        // it's weird.
                        if (value === undefined) {
                            value = null;
                        }

                        resolve(value);
                    };
                    transaction.onabort = transaction.onerror = function () {
                        var err = req.error ? req.error : req.transaction.error;
                        reject(err);
                    };
                } catch (e) {
                    reject(e);
                }
            });
        })["catch"](reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function removeItem(key, callback) {
    var self = this;

    key = normalizeKey(key);

    var promise = new Promise$1(function (resolve, reject) {
        self.ready().then(function () {
            createTransaction(self._dbInfo, READ_WRITE, function (err, transaction) {
                if (err) {
                    return reject(err);
                }

                try {
                    var store = transaction.objectStore(self._dbInfo.storeName);
                    // We use a Grunt task to make this safe for IE and some
                    // versions of Android (including those used by Cordova).
                    // Normally IE won't like `.delete()` and will insist on
                    // using `['delete']()`, but we have a build step that
                    // fixes this for us now.
                    var req = store["delete"](key);
                    transaction.oncomplete = function () {
                        resolve();
                    };

                    transaction.onerror = function () {
                        reject(req.error);
                    };

                    // The request will be also be aborted if we've exceeded our storage
                    // space.
                    transaction.onabort = function () {
                        var err = req.error ? req.error : req.transaction.error;
                        reject(err);
                    };
                } catch (e) {
                    reject(e);
                }
            });
        })["catch"](reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function clear(callback) {
    var self = this;

    var promise = new Promise$1(function (resolve, reject) {
        self.ready().then(function () {
            createTransaction(self._dbInfo, READ_WRITE, function (err, transaction) {
                if (err) {
                    return reject(err);
                }

                try {
                    var store = transaction.objectStore(self._dbInfo.storeName);
                    var req = store.clear();

                    transaction.oncomplete = function () {
                        resolve();
                    };

                    transaction.onabort = transaction.onerror = function () {
                        var err = req.error ? req.error : req.transaction.error;
                        reject(err);
                    };
                } catch (e) {
                    reject(e);
                }
            });
        })["catch"](reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function length(callback) {
    var self = this;

    var promise = new Promise$1(function (resolve, reject) {
        self.ready().then(function () {
            createTransaction(self._dbInfo, READ_ONLY, function (err, transaction) {
                if (err) {
                    return reject(err);
                }

                try {
                    var store = transaction.objectStore(self._dbInfo.storeName);
                    var req = store.count();

                    req.onsuccess = function () {
                        resolve(req.result);
                    };

                    req.onerror = function () {
                        reject(req.error);
                    };
                } catch (e) {
                    reject(e);
                }
            });
        })["catch"](reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function key(n, callback) {
    var self = this;

    var promise = new Promise$1(function (resolve, reject) {
        if (n < 0) {
            resolve(null);

            return;
        }

        self.ready().then(function () {
            createTransaction(self._dbInfo, READ_ONLY, function (err, transaction) {
                if (err) {
                    return reject(err);
                }

                try {
                    var store = transaction.objectStore(self._dbInfo.storeName);
                    var advanced = false;
                    var req = store.openCursor();

                    req.onsuccess = function () {
                        var cursor = req.result;
                        if (!cursor) {
                            // this means there weren't enough keys
                            resolve(null);

                            return;
                        }

                        if (n === 0) {
                            // We have the first key, return it if that's what they
                            // wanted.
                            resolve(cursor.key);
                        } else {
                            if (!advanced) {
                                // Otherwise, ask the cursor to skip ahead n
                                // records.
                                advanced = true;
                                cursor.advance(n);
                            } else {
                                // When we get here, we've got the nth key.
                                resolve(cursor.key);
                            }
                        }
                    };

                    req.onerror = function () {
                        reject(req.error);
                    };
                } catch (e) {
                    reject(e);
                }
            });
        })["catch"](reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function keys(callback) {
    var self = this;

    var promise = new Promise$1(function (resolve, reject) {
        self.ready().then(function () {
            createTransaction(self._dbInfo, READ_ONLY, function (err, transaction) {
                if (err) {
                    return reject(err);
                }

                try {
                    var store = transaction.objectStore(self._dbInfo.storeName);
                    var req = store.openCursor();
                    var keys = [];

                    req.onsuccess = function () {
                        var cursor = req.result;

                        if (!cursor) {
                            resolve(keys);
                            return;
                        }

                        keys.push(cursor.key);
                        cursor["continue"]();
                    };

                    req.onerror = function () {
                        reject(req.error);
                    };
                } catch (e) {
                    reject(e);
                }
            });
        })["catch"](reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function dropInstance(options, callback) {
    callback = getCallback.apply(this, arguments);

    var currentConfig = this.config();
    options = typeof options !== 'function' && options || {};
    if (!options.name) {
        options.name = options.name || currentConfig.name;
        options.storeName = options.storeName || currentConfig.storeName;
    }

    var self = this;
    var promise;
    if (!options.name) {
        promise = Promise$1.reject('Invalid arguments');
    } else {
        var isCurrentDb = options.name === currentConfig.name && self._dbInfo.db;

        var dbPromise = isCurrentDb ? Promise$1.resolve(self._dbInfo.db) : _getOriginalConnection(options).then(function (db) {
            var dbContext = dbContexts[options.name];
            var forages = dbContext.forages;
            dbContext.db = db;
            for (var i = 0; i < forages.length; i++) {
                forages[i]._dbInfo.db = db;
            }
            return db;
        });

        if (!options.storeName) {
            promise = dbPromise.then(function (db) {
                _deferReadiness(options);

                var dbContext = dbContexts[options.name];
                var forages = dbContext.forages;

                db.close();
                for (var i = 0; i < forages.length; i++) {
                    var forage = forages[i];
                    forage._dbInfo.db = null;
                }

                var dropDBPromise = new Promise$1(function (resolve, reject) {
                    var req = idb.deleteDatabase(options.name);

                    req.onerror = req.onblocked = function (err) {
                        var db = req.result;
                        if (db) {
                            db.close();
                        }
                        reject(err);
                    };

                    req.onsuccess = function () {
                        var db = req.result;
                        if (db) {
                            db.close();
                        }
                        resolve(db);
                    };
                });

                return dropDBPromise.then(function (db) {
                    dbContext.db = db;
                    for (var i = 0; i < forages.length; i++) {
                        var _forage = forages[i];
                        _advanceReadiness(_forage._dbInfo);
                    }
                })["catch"](function (err) {
                    (_rejectReadiness(options, err) || Promise$1.resolve())["catch"](function () {});
                    throw err;
                });
            });
        } else {
            promise = dbPromise.then(function (db) {
                if (!db.objectStoreNames.contains(options.storeName)) {
                    return;
                }

                var newVersion = db.version + 1;

                _deferReadiness(options);

                var dbContext = dbContexts[options.name];
                var forages = dbContext.forages;

                db.close();
                for (var i = 0; i < forages.length; i++) {
                    var forage = forages[i];
                    forage._dbInfo.db = null;
                    forage._dbInfo.version = newVersion;
                }

                var dropObjectPromise = new Promise$1(function (resolve, reject) {
                    var req = idb.open(options.name, newVersion);

                    req.onerror = function (err) {
                        var db = req.result;
                        db.close();
                        reject(err);
                    };

                    req.onupgradeneeded = function () {
                        var db = req.result;
                        db.deleteObjectStore(options.storeName);
                    };

                    req.onsuccess = function () {
                        var db = req.result;
                        db.close();
                        resolve(db);
                    };
                });

                return dropObjectPromise.then(function (db) {
                    dbContext.db = db;
                    for (var j = 0; j < forages.length; j++) {
                        var _forage2 = forages[j];
                        _forage2._dbInfo.db = db;
                        _advanceReadiness(_forage2._dbInfo);
                    }
                })["catch"](function (err) {
                    (_rejectReadiness(options, err) || Promise$1.resolve())["catch"](function () {});
                    throw err;
                });
            });
        }
    }

    executeCallback(promise, callback);
    return promise;
}

var asyncStorage = {
    _driver: 'asyncStorage',
    _initStorage: _initStorage,
    _support: isIndexedDBValid(),
    iterate: iterate,
    getItem: getItem,
    setItem: setItem,
    removeItem: removeItem,
    clear: clear,
    length: length,
    key: key,
    keys: keys,
    dropInstance: dropInstance
};

function isWebSQLValid() {
    return typeof openDatabase === 'function';
}

// Sadly, the best way to save binary data in WebSQL/localStorage is serializing
// it to Base64, so this is how we store it to prevent very strange errors with less
// verbose ways of binary <-> string data storage.
var BASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

var BLOB_TYPE_PREFIX = '~~local_forage_type~';
var BLOB_TYPE_PREFIX_REGEX = /^~~local_forage_type~([^~]+)~/;

var SERIALIZED_MARKER = '__lfsc__:';
var SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER.length;

// OMG the serializations!
var TYPE_ARRAYBUFFER = 'arbf';
var TYPE_BLOB = 'blob';
var TYPE_INT8ARRAY = 'si08';
var TYPE_UINT8ARRAY = 'ui08';
var TYPE_UINT8CLAMPEDARRAY = 'uic8';
var TYPE_INT16ARRAY = 'si16';
var TYPE_INT32ARRAY = 'si32';
var TYPE_UINT16ARRAY = 'ur16';
var TYPE_UINT32ARRAY = 'ui32';
var TYPE_FLOAT32ARRAY = 'fl32';
var TYPE_FLOAT64ARRAY = 'fl64';
var TYPE_SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER_LENGTH + TYPE_ARRAYBUFFER.length;

var toString$1 = Object.prototype.toString;

function stringToBuffer(serializedString) {
    // Fill the string into a ArrayBuffer.
    var bufferLength = serializedString.length * 0.75;
    var len = serializedString.length;
    var i;
    var p = 0;
    var encoded1, encoded2, encoded3, encoded4;

    if (serializedString[serializedString.length - 1] === '=') {
        bufferLength--;
        if (serializedString[serializedString.length - 2] === '=') {
            bufferLength--;
        }
    }

    var buffer = new ArrayBuffer(bufferLength);
    var bytes = new Uint8Array(buffer);

    for (i = 0; i < len; i += 4) {
        encoded1 = BASE_CHARS.indexOf(serializedString[i]);
        encoded2 = BASE_CHARS.indexOf(serializedString[i + 1]);
        encoded3 = BASE_CHARS.indexOf(serializedString[i + 2]);
        encoded4 = BASE_CHARS.indexOf(serializedString[i + 3]);

        /*jslint bitwise: true */
        bytes[p++] = encoded1 << 2 | encoded2 >> 4;
        bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
        bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
    }
    return buffer;
}

// Converts a buffer to a string to store, serialized, in the backend
// storage library.
function bufferToString(buffer) {
    // base64-arraybuffer
    var bytes = new Uint8Array(buffer);
    var base64String = '';
    var i;

    for (i = 0; i < bytes.length; i += 3) {
        /*jslint bitwise: true */
        base64String += BASE_CHARS[bytes[i] >> 2];
        base64String += BASE_CHARS[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
        base64String += BASE_CHARS[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
        base64String += BASE_CHARS[bytes[i + 2] & 63];
    }

    if (bytes.length % 3 === 2) {
        base64String = base64String.substring(0, base64String.length - 1) + '=';
    } else if (bytes.length % 3 === 1) {
        base64String = base64String.substring(0, base64String.length - 2) + '==';
    }

    return base64String;
}

// Serialize a value, afterwards executing a callback (which usually
// instructs the `setItem()` callback/promise to be executed). This is how
// we store binary data with localStorage.
function serialize(value, callback) {
    var valueType = '';
    if (value) {
        valueType = toString$1.call(value);
    }

    // Cannot use `value instanceof ArrayBuffer` or such here, as these
    // checks fail when running the tests using casper.js...
    //
    // TODO: See why those tests fail and use a better solution.
    if (value && (valueType === '[object ArrayBuffer]' || value.buffer && toString$1.call(value.buffer) === '[object ArrayBuffer]')) {
        // Convert binary arrays to a string and prefix the string with
        // a special marker.
        var buffer;
        var marker = SERIALIZED_MARKER;

        if (value instanceof ArrayBuffer) {
            buffer = value;
            marker += TYPE_ARRAYBUFFER;
        } else {
            buffer = value.buffer;

            if (valueType === '[object Int8Array]') {
                marker += TYPE_INT8ARRAY;
            } else if (valueType === '[object Uint8Array]') {
                marker += TYPE_UINT8ARRAY;
            } else if (valueType === '[object Uint8ClampedArray]') {
                marker += TYPE_UINT8CLAMPEDARRAY;
            } else if (valueType === '[object Int16Array]') {
                marker += TYPE_INT16ARRAY;
            } else if (valueType === '[object Uint16Array]') {
                marker += TYPE_UINT16ARRAY;
            } else if (valueType === '[object Int32Array]') {
                marker += TYPE_INT32ARRAY;
            } else if (valueType === '[object Uint32Array]') {
                marker += TYPE_UINT32ARRAY;
            } else if (valueType === '[object Float32Array]') {
                marker += TYPE_FLOAT32ARRAY;
            } else if (valueType === '[object Float64Array]') {
                marker += TYPE_FLOAT64ARRAY;
            } else {
                callback(new Error('Failed to get type for BinaryArray'));
            }
        }

        callback(marker + bufferToString(buffer));
    } else if (valueType === '[object Blob]') {
        // Conver the blob to a binaryArray and then to a string.
        var fileReader = new FileReader();

        fileReader.onload = function () {
            // Backwards-compatible prefix for the blob type.
            var str = BLOB_TYPE_PREFIX + value.type + '~' + bufferToString(this.result);

            callback(SERIALIZED_MARKER + TYPE_BLOB + str);
        };

        fileReader.readAsArrayBuffer(value);
    } else {
        try {
            callback(JSON.stringify(value));
        } catch (e) {
            console.error("Couldn't convert value into a JSON string: ", value);

            callback(null, e);
        }
    }
}

// Deserialize data we've inserted into a value column/field. We place
// special markers into our strings to mark them as encoded; this isn't
// as nice as a meta field, but it's the only sane thing we can do whilst
// keeping localStorage support intact.
//
// Oftentimes this will just deserialize JSON content, but if we have a
// special marker (SERIALIZED_MARKER, defined above), we will extract
// some kind of arraybuffer/binary data/typed array out of the string.
function deserialize(value) {
    // If we haven't marked this string as being specially serialized (i.e.
    // something other than serialized JSON), we can just return it and be
    // done with it.
    if (value.substring(0, SERIALIZED_MARKER_LENGTH) !== SERIALIZED_MARKER) {
        return JSON.parse(value);
    }

    // The following code deals with deserializing some kind of Blob or
    // TypedArray. First we separate out the type of data we're dealing
    // with from the data itself.
    var serializedString = value.substring(TYPE_SERIALIZED_MARKER_LENGTH);
    var type = value.substring(SERIALIZED_MARKER_LENGTH, TYPE_SERIALIZED_MARKER_LENGTH);

    var blobType;
    // Backwards-compatible blob type serialization strategy.
    // DBs created with older versions of localForage will simply not have the blob type.
    if (type === TYPE_BLOB && BLOB_TYPE_PREFIX_REGEX.test(serializedString)) {
        var matcher = serializedString.match(BLOB_TYPE_PREFIX_REGEX);
        blobType = matcher[1];
        serializedString = serializedString.substring(matcher[0].length);
    }
    var buffer = stringToBuffer(serializedString);

    // Return the right type based on the code/type set during
    // serialization.
    switch (type) {
        case TYPE_ARRAYBUFFER:
            return buffer;
        case TYPE_BLOB:
            return createBlob([buffer], { type: blobType });
        case TYPE_INT8ARRAY:
            return new Int8Array(buffer);
        case TYPE_UINT8ARRAY:
            return new Uint8Array(buffer);
        case TYPE_UINT8CLAMPEDARRAY:
            return new Uint8ClampedArray(buffer);
        case TYPE_INT16ARRAY:
            return new Int16Array(buffer);
        case TYPE_UINT16ARRAY:
            return new Uint16Array(buffer);
        case TYPE_INT32ARRAY:
            return new Int32Array(buffer);
        case TYPE_UINT32ARRAY:
            return new Uint32Array(buffer);
        case TYPE_FLOAT32ARRAY:
            return new Float32Array(buffer);
        case TYPE_FLOAT64ARRAY:
            return new Float64Array(buffer);
        default:
            throw new Error('Unkown type: ' + type);
    }
}

var localforageSerializer = {
    serialize: serialize,
    deserialize: deserialize,
    stringToBuffer: stringToBuffer,
    bufferToString: bufferToString
};

/*
 * Includes code from:
 *
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */

function createDbTable(t, dbInfo, callback, errorCallback) {
    t.executeSql('CREATE TABLE IF NOT EXISTS ' + dbInfo.storeName + ' ' + '(id INTEGER PRIMARY KEY, key unique, value)', [], callback, errorCallback);
}

// Open the WebSQL database (automatically creates one if one didn't
// previously exist), using any options set in the config.
function _initStorage$1(options) {
    var self = this;
    var dbInfo = {
        db: null
    };

    if (options) {
        for (var i in options) {
            dbInfo[i] = typeof options[i] !== 'string' ? options[i].toString() : options[i];
        }
    }

    var dbInfoPromise = new Promise$1(function (resolve, reject) {
        // Open the database; the openDatabase API will automatically
        // create it for us if it doesn't exist.
        try {
            dbInfo.db = openDatabase(dbInfo.name, String(dbInfo.version), dbInfo.description, dbInfo.size);
        } catch (e) {
            return reject(e);
        }

        // Create our key/value table if it doesn't exist.
        dbInfo.db.transaction(function (t) {
            createDbTable(t, dbInfo, function () {
                self._dbInfo = dbInfo;
                resolve();
            }, function (t, error) {
                reject(error);
            });
        }, reject);
    });

    dbInfo.serializer = localforageSerializer;
    return dbInfoPromise;
}

function tryExecuteSql(t, dbInfo, sqlStatement, args, callback, errorCallback) {
    t.executeSql(sqlStatement, args, callback, function (t, error) {
        if (error.code === error.SYNTAX_ERR) {
            t.executeSql('SELECT name FROM sqlite_master ' + "WHERE type='table' AND name = ?", [dbInfo.storeName], function (t, results) {
                if (!results.rows.length) {
                    // if the table is missing (was deleted)
                    // re-create it table and retry
                    createDbTable(t, dbInfo, function () {
                        t.executeSql(sqlStatement, args, callback, errorCallback);
                    }, errorCallback);
                } else {
                    errorCallback(t, error);
                }
            }, errorCallback);
        } else {
            errorCallback(t, error);
        }
    }, errorCallback);
}

function getItem$1(key, callback) {
    var self = this;

    key = normalizeKey(key);

    var promise = new Promise$1(function (resolve, reject) {
        self.ready().then(function () {
            var dbInfo = self._dbInfo;
            dbInfo.db.transaction(function (t) {
                tryExecuteSql(t, dbInfo, 'SELECT * FROM ' + dbInfo.storeName + ' WHERE key = ? LIMIT 1', [key], function (t, results) {
                    var result = results.rows.length ? results.rows.item(0).value : null;

                    // Check to see if this is serialized content we need to
                    // unpack.
                    if (result) {
                        result = dbInfo.serializer.deserialize(result);
                    }

                    resolve(result);
                }, function (t, error) {
                    reject(error);
                });
            });
        })["catch"](reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function iterate$1(iterator, callback) {
    var self = this;

    var promise = new Promise$1(function (resolve, reject) {
        self.ready().then(function () {
            var dbInfo = self._dbInfo;

            dbInfo.db.transaction(function (t) {
                tryExecuteSql(t, dbInfo, 'SELECT * FROM ' + dbInfo.storeName, [], function (t, results) {
                    var rows = results.rows;
                    var length = rows.length;

                    for (var i = 0; i < length; i++) {
                        var item = rows.item(i);
                        var result = item.value;

                        // Check to see if this is serialized content
                        // we need to unpack.
                        if (result) {
                            result = dbInfo.serializer.deserialize(result);
                        }

                        result = iterator(result, item.key, i + 1);

                        // void(0) prevents problems with redefinition
                        // of `undefined`.
                        if (result !== void 0) {
                            resolve(result);
                            return;
                        }
                    }

                    resolve();
                }, function (t, error) {
                    reject(error);
                });
            });
        })["catch"](reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function _setItem(key, value, callback, retriesLeft) {
    var self = this;

    key = normalizeKey(key);

    var promise = new Promise$1(function (resolve, reject) {
        self.ready().then(function () {
            // The localStorage API doesn't return undefined values in an
            // "expected" way, so undefined is always cast to null in all
            // drivers. See: https://github.com/mozilla/localForage/pull/42
            if (value === undefined) {
                value = null;
            }

            // Save the original value to pass to the callback.
            var originalValue = value;

            var dbInfo = self._dbInfo;
            dbInfo.serializer.serialize(value, function (value, error) {
                if (error) {
                    reject(error);
                } else {
                    dbInfo.db.transaction(function (t) {
                        tryExecuteSql(t, dbInfo, 'INSERT OR REPLACE INTO ' + dbInfo.storeName + ' ' + '(key, value) VALUES (?, ?)', [key, value], function () {
                            resolve(originalValue);
                        }, function (t, error) {
                            reject(error);
                        });
                    }, function (sqlError) {
                        // The transaction failed; check
                        // to see if it's a quota error.
                        if (sqlError.code === sqlError.QUOTA_ERR) {
                            // We reject the callback outright for now, but
                            // it's worth trying to re-run the transaction.
                            // Even if the user accepts the prompt to use
                            // more storage on Safari, this error will
                            // be called.
                            //
                            // Try to re-run the transaction.
                            if (retriesLeft > 0) {
                                resolve(_setItem.apply(self, [key, originalValue, callback, retriesLeft - 1]));
                                return;
                            }
                            reject(sqlError);
                        }
                    });
                }
            });
        })["catch"](reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function setItem$1(key, value, callback) {
    return _setItem.apply(this, [key, value, callback, 1]);
}

function removeItem$1(key, callback) {
    var self = this;

    key = normalizeKey(key);

    var promise = new Promise$1(function (resolve, reject) {
        self.ready().then(function () {
            var dbInfo = self._dbInfo;
            dbInfo.db.transaction(function (t) {
                tryExecuteSql(t, dbInfo, 'DELETE FROM ' + dbInfo.storeName + ' WHERE key = ?', [key], function () {
                    resolve();
                }, function (t, error) {
                    reject(error);
                });
            });
        })["catch"](reject);
    });

    executeCallback(promise, callback);
    return promise;
}

// Deletes every item in the table.
// TODO: Find out if this resets the AUTO_INCREMENT number.
function clear$1(callback) {
    var self = this;

    var promise = new Promise$1(function (resolve, reject) {
        self.ready().then(function () {
            var dbInfo = self._dbInfo;
            dbInfo.db.transaction(function (t) {
                tryExecuteSql(t, dbInfo, 'DELETE FROM ' + dbInfo.storeName, [], function () {
                    resolve();
                }, function (t, error) {
                    reject(error);
                });
            });
        })["catch"](reject);
    });

    executeCallback(promise, callback);
    return promise;
}

// Does a simple `COUNT(key)` to get the number of items stored in
// localForage.
function length$1(callback) {
    var self = this;

    var promise = new Promise$1(function (resolve, reject) {
        self.ready().then(function () {
            var dbInfo = self._dbInfo;
            dbInfo.db.transaction(function (t) {
                // Ahhh, SQL makes this one soooooo easy.
                tryExecuteSql(t, dbInfo, 'SELECT COUNT(key) as c FROM ' + dbInfo.storeName, [], function (t, results) {
                    var result = results.rows.item(0).c;
                    resolve(result);
                }, function (t, error) {
                    reject(error);
                });
            });
        })["catch"](reject);
    });

    executeCallback(promise, callback);
    return promise;
}

// Return the key located at key index X; essentially gets the key from a
// `WHERE id = ?`. This is the most efficient way I can think to implement
// this rarely-used (in my experience) part of the API, but it can seem
// inconsistent, because we do `INSERT OR REPLACE INTO` on `setItem()`, so
// the ID of each key will change every time it's updated. Perhaps a stored
// procedure for the `setItem()` SQL would solve this problem?
// TODO: Don't change ID on `setItem()`.
function key$1(n, callback) {
    var self = this;

    var promise = new Promise$1(function (resolve, reject) {
        self.ready().then(function () {
            var dbInfo = self._dbInfo;
            dbInfo.db.transaction(function (t) {
                tryExecuteSql(t, dbInfo, 'SELECT key FROM ' + dbInfo.storeName + ' WHERE id = ? LIMIT 1', [n + 1], function (t, results) {
                    var result = results.rows.length ? results.rows.item(0).key : null;
                    resolve(result);
                }, function (t, error) {
                    reject(error);
                });
            });
        })["catch"](reject);
    });

    executeCallback(promise, callback);
    return promise;
}

function keys$1(callback) {
    var self = this;

    var promise = new Promise$1(function (resolve, reject) {
        self.ready().then(function () {
            var dbInfo = self._dbInfo;
            dbInfo.db.transaction(function (t) {
                tryExecuteSql(t, dbInfo, 'SELECT key FROM ' + dbInfo.storeName, [], function (t, results) {
                    var keys = [];

                    for (var i = 0; i < results.rows.length; i++) {
                        keys.push(results.rows.item(i).key);
                    }

                    resolve(keys);
                }, function (t, error) {
                    reject(error);
                });
            });
        })["catch"](reject);
    });

    executeCallback(promise, callback);
    return promise;
}

// https://www.w3.org/TR/webdatabase/#databases
// > There is no way to enumerate or delete the databases available for an origin from this API.
function getAllStoreNames(db) {
    return new Promise$1(function (resolve, reject) {
        db.transaction(function (t) {
            t.executeSql('SELECT name FROM sqlite_master ' + "WHERE type='table' AND name <> '__WebKitDatabaseInfoTable__'", [], function (t, results) {
                var storeNames = [];

                for (var i = 0; i < results.rows.length; i++) {
                    storeNames.push(results.rows.item(i).name);
                }

                resolve({
                    db: db,
                    storeNames: storeNames
                });
            }, function (t, error) {
                reject(error);
            });
        }, function (sqlError) {
            reject(sqlError);
        });
    });
}

function dropInstance$1(options, callback) {
    callback = getCallback.apply(this, arguments);

    var currentConfig = this.config();
    options = typeof options !== 'function' && options || {};
    if (!options.name) {
        options.name = options.name || currentConfig.name;
        options.storeName = options.storeName || currentConfig.storeName;
    }

    var self = this;
    var promise;
    if (!options.name) {
        promise = Promise$1.reject('Invalid arguments');
    } else {
        promise = new Promise$1(function (resolve) {
            var db;
            if (options.name === currentConfig.name) {
                // use the db reference of the current instance
                db = self._dbInfo.db;
            } else {
                db = openDatabase(options.name, '', '', 0);
            }

            if (!options.storeName) {
                // drop all database tables
                resolve(getAllStoreNames(db));
            } else {
                resolve({
                    db: db,
                    storeNames: [options.storeName]
                });
            }
        }).then(function (operationInfo) {
            return new Promise$1(function (resolve, reject) {
                operationInfo.db.transaction(function (t) {
                    function dropTable(storeName) {
                        return new Promise$1(function (resolve, reject) {
                            t.executeSql('DROP TABLE IF EXISTS ' + storeName, [], function () {
                                resolve();
                            }, function (t, error) {
                                reject(error);
                            });
                        });
                    }

                    var operations = [];
                    for (var i = 0, len = operationInfo.storeNames.length; i < len; i++) {
                        operations.push(dropTable(operationInfo.storeNames[i]));
                    }

                    Promise$1.all(operations).then(function () {
                        resolve();
                    })["catch"](function (e) {
                        reject(e);
                    });
                }, function (sqlError) {
                    reject(sqlError);
                });
            });
        });
    }

    executeCallback(promise, callback);
    return promise;
}

var webSQLStorage = {
    _driver: 'webSQLStorage',
    _initStorage: _initStorage$1,
    _support: isWebSQLValid(),
    iterate: iterate$1,
    getItem: getItem$1,
    setItem: setItem$1,
    removeItem: removeItem$1,
    clear: clear$1,
    length: length$1,
    key: key$1,
    keys: keys$1,
    dropInstance: dropInstance$1
};

function isLocalStorageValid() {
    try {
        return typeof localStorage !== 'undefined' && 'setItem' in localStorage &&
        // in IE8 typeof localStorage.setItem === 'object'
        !!localStorage.setItem;
    } catch (e) {
        return false;
    }
}

function _getKeyPrefix(options, defaultConfig) {
    var keyPrefix = options.name + '/';

    if (options.storeName !== defaultConfig.storeName) {
        keyPrefix += options.storeName + '/';
    }
    return keyPrefix;
}

// Check if localStorage throws when saving an item
function checkIfLocalStorageThrows() {
    var localStorageTestKey = '_localforage_support_test';

    try {
        localStorage.setItem(localStorageTestKey, true);
        localStorage.removeItem(localStorageTestKey);

        return false;
    } catch (e) {
        return true;
    }
}

// Check if localStorage is usable and allows to save an item
// This method checks if localStorage is usable in Safari Private Browsing
// mode, or in any other case where the available quota for localStorage
// is 0 and there wasn't any saved items yet.
function _isLocalStorageUsable() {
    return !checkIfLocalStorageThrows() || localStorage.length > 0;
}

// Config the localStorage backend, using options set in the config.
function _initStorage$2(options) {
    var self = this;
    var dbInfo = {};
    if (options) {
        for (var i in options) {
            dbInfo[i] = options[i];
        }
    }

    dbInfo.keyPrefix = _getKeyPrefix(options, self._defaultConfig);

    if (!_isLocalStorageUsable()) {
        return Promise$1.reject();
    }

    self._dbInfo = dbInfo;
    dbInfo.serializer = localforageSerializer;

    return Promise$1.resolve();
}

// Remove all keys from the datastore, effectively destroying all data in
// the app's key/value store!
function clear$2(callback) {
    var self = this;
    var promise = self.ready().then(function () {
        var keyPrefix = self._dbInfo.keyPrefix;

        for (var i = localStorage.length - 1; i >= 0; i--) {
            var key = localStorage.key(i);

            if (key.indexOf(keyPrefix) === 0) {
                localStorage.removeItem(key);
            }
        }
    });

    executeCallback(promise, callback);
    return promise;
}

// Retrieve an item from the store. Unlike the original async_storage
// library in Gaia, we don't modify return values at all. If a key's value
// is `undefined`, we pass that value to the callback function.
function getItem$2(key, callback) {
    var self = this;

    key = normalizeKey(key);

    var promise = self.ready().then(function () {
        var dbInfo = self._dbInfo;
        var result = localStorage.getItem(dbInfo.keyPrefix + key);

        // If a result was found, parse it from the serialized
        // string into a JS object. If result isn't truthy, the key
        // is likely undefined and we'll pass it straight to the
        // callback.
        if (result) {
            result = dbInfo.serializer.deserialize(result);
        }

        return result;
    });

    executeCallback(promise, callback);
    return promise;
}

// Iterate over all items in the store.
function iterate$2(iterator, callback) {
    var self = this;

    var promise = self.ready().then(function () {
        var dbInfo = self._dbInfo;
        var keyPrefix = dbInfo.keyPrefix;
        var keyPrefixLength = keyPrefix.length;
        var length = localStorage.length;

        // We use a dedicated iterator instead of the `i` variable below
        // so other keys we fetch in localStorage aren't counted in
        // the `iterationNumber` argument passed to the `iterate()`
        // callback.
        //
        // See: github.com/mozilla/localForage/pull/435#discussion_r38061530
        var iterationNumber = 1;

        for (var i = 0; i < length; i++) {
            var key = localStorage.key(i);
            if (key.indexOf(keyPrefix) !== 0) {
                continue;
            }
            var value = localStorage.getItem(key);

            // If a result was found, parse it from the serialized
            // string into a JS object. If result isn't truthy, the
            // key is likely undefined and we'll pass it straight
            // to the iterator.
            if (value) {
                value = dbInfo.serializer.deserialize(value);
            }

            value = iterator(value, key.substring(keyPrefixLength), iterationNumber++);

            if (value !== void 0) {
                return value;
            }
        }
    });

    executeCallback(promise, callback);
    return promise;
}

// Same as localStorage's key() method, except takes a callback.
function key$2(n, callback) {
    var self = this;
    var promise = self.ready().then(function () {
        var dbInfo = self._dbInfo;
        var result;
        try {
            result = localStorage.key(n);
        } catch (error) {
            result = null;
        }

        // Remove the prefix from the key, if a key is found.
        if (result) {
            result = result.substring(dbInfo.keyPrefix.length);
        }

        return result;
    });

    executeCallback(promise, callback);
    return promise;
}

function keys$2(callback) {
    var self = this;
    var promise = self.ready().then(function () {
        var dbInfo = self._dbInfo;
        var length = localStorage.length;
        var keys = [];

        for (var i = 0; i < length; i++) {
            var itemKey = localStorage.key(i);
            if (itemKey.indexOf(dbInfo.keyPrefix) === 0) {
                keys.push(itemKey.substring(dbInfo.keyPrefix.length));
            }
        }

        return keys;
    });

    executeCallback(promise, callback);
    return promise;
}

// Supply the number of keys in the datastore to the callback function.
function length$2(callback) {
    var self = this;
    var promise = self.keys().then(function (keys) {
        return keys.length;
    });

    executeCallback(promise, callback);
    return promise;
}

// Remove an item from the store, nice and simple.
function removeItem$2(key, callback) {
    var self = this;

    key = normalizeKey(key);

    var promise = self.ready().then(function () {
        var dbInfo = self._dbInfo;
        localStorage.removeItem(dbInfo.keyPrefix + key);
    });

    executeCallback(promise, callback);
    return promise;
}

// Set a key's value and run an optional callback once the value is set.
// Unlike Gaia's implementation, the callback function is passed the value,
// in case you want to operate on that value only after you're sure it
// saved, or something like that.
function setItem$2(key, value, callback) {
    var self = this;

    key = normalizeKey(key);

    var promise = self.ready().then(function () {
        // Convert undefined values to null.
        // https://github.com/mozilla/localForage/pull/42
        if (value === undefined) {
            value = null;
        }

        // Save the original value to pass to the callback.
        var originalValue = value;

        return new Promise$1(function (resolve, reject) {
            var dbInfo = self._dbInfo;
            dbInfo.serializer.serialize(value, function (value, error) {
                if (error) {
                    reject(error);
                } else {
                    try {
                        localStorage.setItem(dbInfo.keyPrefix + key, value);
                        resolve(originalValue);
                    } catch (e) {
                        // localStorage capacity exceeded.
                        // TODO: Make this a specific error/event.
                        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                            reject(e);
                        }
                        reject(e);
                    }
                }
            });
        });
    });

    executeCallback(promise, callback);
    return promise;
}

function dropInstance$2(options, callback) {
    callback = getCallback.apply(this, arguments);

    options = typeof options !== 'function' && options || {};
    if (!options.name) {
        var currentConfig = this.config();
        options.name = options.name || currentConfig.name;
        options.storeName = options.storeName || currentConfig.storeName;
    }

    var self = this;
    var promise;
    if (!options.name) {
        promise = Promise$1.reject('Invalid arguments');
    } else {
        promise = new Promise$1(function (resolve) {
            if (!options.storeName) {
                resolve(options.name + '/');
            } else {
                resolve(_getKeyPrefix(options, self._defaultConfig));
            }
        }).then(function (keyPrefix) {
            for (var i = localStorage.length - 1; i >= 0; i--) {
                var key = localStorage.key(i);

                if (key.indexOf(keyPrefix) === 0) {
                    localStorage.removeItem(key);
                }
            }
        });
    }

    executeCallback(promise, callback);
    return promise;
}

var localStorageWrapper = {
    _driver: 'localStorageWrapper',
    _initStorage: _initStorage$2,
    _support: isLocalStorageValid(),
    iterate: iterate$2,
    getItem: getItem$2,
    setItem: setItem$2,
    removeItem: removeItem$2,
    clear: clear$2,
    length: length$2,
    key: key$2,
    keys: keys$2,
    dropInstance: dropInstance$2
};

var sameValue = function sameValue(x, y) {
    return x === y || typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y);
};

var includes = function includes(array, searchElement) {
    var len = array.length;
    var i = 0;
    while (i < len) {
        if (sameValue(array[i], searchElement)) {
            return true;
        }
        i++;
    }

    return false;
};

var isArray = Array.isArray || function (arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
};

// Drivers are stored here when `defineDriver()` is called.
// They are shared across all instances of localForage.
var DefinedDrivers = {};

var DriverSupport = {};

var DefaultDrivers = {
    INDEXEDDB: asyncStorage,
    WEBSQL: webSQLStorage,
    LOCALSTORAGE: localStorageWrapper
};

var DefaultDriverOrder = [DefaultDrivers.INDEXEDDB._driver, DefaultDrivers.WEBSQL._driver, DefaultDrivers.LOCALSTORAGE._driver];

var OptionalDriverMethods = ['dropInstance'];

var LibraryMethods = ['clear', 'getItem', 'iterate', 'key', 'keys', 'length', 'removeItem', 'setItem'].concat(OptionalDriverMethods);

var DefaultConfig = {
    description: '',
    driver: DefaultDriverOrder.slice(),
    name: 'localforage',
    // Default DB size is _JUST UNDER_ 5MB, as it's the highest size
    // we can use without a prompt.
    size: 4980736,
    storeName: 'keyvaluepairs',
    version: 1.0
};

function callWhenReady(localForageInstance, libraryMethod) {
    localForageInstance[libraryMethod] = function () {
        var _args = arguments;
        return localForageInstance.ready().then(function () {
            return localForageInstance[libraryMethod].apply(localForageInstance, _args);
        });
    };
}

function extend() {
    for (var i = 1; i < arguments.length; i++) {
        var arg = arguments[i];

        if (arg) {
            for (var _key in arg) {
                if (arg.hasOwnProperty(_key)) {
                    if (isArray(arg[_key])) {
                        arguments[0][_key] = arg[_key].slice();
                    } else {
                        arguments[0][_key] = arg[_key];
                    }
                }
            }
        }
    }

    return arguments[0];
}

var LocalForage = function () {
    function LocalForage(options) {
        _classCallCheck(this, LocalForage);

        for (var driverTypeKey in DefaultDrivers) {
            if (DefaultDrivers.hasOwnProperty(driverTypeKey)) {
                var driver = DefaultDrivers[driverTypeKey];
                var driverName = driver._driver;
                this[driverTypeKey] = driverName;

                if (!DefinedDrivers[driverName]) {
                    // we don't need to wait for the promise,
                    // since the default drivers can be defined
                    // in a blocking manner
                    this.defineDriver(driver);
                }
            }
        }

        this._defaultConfig = extend({}, DefaultConfig);
        this._config = extend({}, this._defaultConfig, options);
        this._driverSet = null;
        this._initDriver = null;
        this._ready = false;
        this._dbInfo = null;

        this._wrapLibraryMethodsWithReady();
        this.setDriver(this._config.driver)["catch"](function () {});
    }

    // Set any config values for localForage; can be called anytime before
    // the first API call (e.g. `getItem`, `setItem`).
    // We loop through options so we don't overwrite existing config
    // values.


    LocalForage.prototype.config = function config(options) {
        // If the options argument is an object, we use it to set values.
        // Otherwise, we return either a specified config value or all
        // config values.
        if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
            // If localforage is ready and fully initialized, we can't set
            // any new configuration values. Instead, we return an error.
            if (this._ready) {
                return new Error("Can't call config() after localforage " + 'has been used.');
            }

            for (var i in options) {
                if (i === 'storeName') {
                    options[i] = options[i].replace(/\W/g, '_');
                }

                if (i === 'version' && typeof options[i] !== 'number') {
                    return new Error('Database version must be a number.');
                }

                this._config[i] = options[i];
            }

            // after all config options are set and
            // the driver option is used, try setting it
            if ('driver' in options && options.driver) {
                return this.setDriver(this._config.driver);
            }

            return true;
        } else if (typeof options === 'string') {
            return this._config[options];
        } else {
            return this._config;
        }
    };

    // Used to define a custom driver, shared across all instances of
    // localForage.


    LocalForage.prototype.defineDriver = function defineDriver(driverObject, callback, errorCallback) {
        var promise = new Promise$1(function (resolve, reject) {
            try {
                var driverName = driverObject._driver;
                var complianceError = new Error('Custom driver not compliant; see ' + 'https://mozilla.github.io/localForage/#definedriver');

                // A driver name should be defined and not overlap with the
                // library-defined, default drivers.
                if (!driverObject._driver) {
                    reject(complianceError);
                    return;
                }

                var driverMethods = LibraryMethods.concat('_initStorage');
                for (var i = 0, len = driverMethods.length; i < len; i++) {
                    var driverMethodName = driverMethods[i];

                    // when the property is there,
                    // it should be a method even when optional
                    var isRequired = !includes(OptionalDriverMethods, driverMethodName);
                    if ((isRequired || driverObject[driverMethodName]) && typeof driverObject[driverMethodName] !== 'function') {
                        reject(complianceError);
                        return;
                    }
                }

                var configureMissingMethods = function configureMissingMethods() {
                    var methodNotImplementedFactory = function methodNotImplementedFactory(methodName) {
                        return function () {
                            var error = new Error('Method ' + methodName + ' is not implemented by the current driver');
                            var promise = Promise$1.reject(error);
                            executeCallback(promise, arguments[arguments.length - 1]);
                            return promise;
                        };
                    };

                    for (var _i = 0, _len = OptionalDriverMethods.length; _i < _len; _i++) {
                        var optionalDriverMethod = OptionalDriverMethods[_i];
                        if (!driverObject[optionalDriverMethod]) {
                            driverObject[optionalDriverMethod] = methodNotImplementedFactory(optionalDriverMethod);
                        }
                    }
                };

                configureMissingMethods();

                var setDriverSupport = function setDriverSupport(support) {
                    if (DefinedDrivers[driverName]) {
                        console.info('Redefining LocalForage driver: ' + driverName);
                    }
                    DefinedDrivers[driverName] = driverObject;
                    DriverSupport[driverName] = support;
                    // don't use a then, so that we can define
                    // drivers that have simple _support methods
                    // in a blocking manner
                    resolve();
                };

                if ('_support' in driverObject) {
                    if (driverObject._support && typeof driverObject._support === 'function') {
                        driverObject._support().then(setDriverSupport, reject);
                    } else {
                        setDriverSupport(!!driverObject._support);
                    }
                } else {
                    setDriverSupport(true);
                }
            } catch (e) {
                reject(e);
            }
        });

        executeTwoCallbacks(promise, callback, errorCallback);
        return promise;
    };

    LocalForage.prototype.driver = function driver() {
        return this._driver || null;
    };

    LocalForage.prototype.getDriver = function getDriver(driverName, callback, errorCallback) {
        var getDriverPromise = DefinedDrivers[driverName] ? Promise$1.resolve(DefinedDrivers[driverName]) : Promise$1.reject(new Error('Driver not found.'));

        executeTwoCallbacks(getDriverPromise, callback, errorCallback);
        return getDriverPromise;
    };

    LocalForage.prototype.getSerializer = function getSerializer(callback) {
        var serializerPromise = Promise$1.resolve(localforageSerializer);
        executeTwoCallbacks(serializerPromise, callback);
        return serializerPromise;
    };

    LocalForage.prototype.ready = function ready(callback) {
        var self = this;

        var promise = self._driverSet.then(function () {
            if (self._ready === null) {
                self._ready = self._initDriver();
            }

            return self._ready;
        });

        executeTwoCallbacks(promise, callback, callback);
        return promise;
    };

    LocalForage.prototype.setDriver = function setDriver(drivers, callback, errorCallback) {
        var self = this;

        if (!isArray(drivers)) {
            drivers = [drivers];
        }

        var supportedDrivers = this._getSupportedDrivers(drivers);

        function setDriverToConfig() {
            self._config.driver = self.driver();
        }

        function extendSelfWithDriver(driver) {
            self._extend(driver);
            setDriverToConfig();

            self._ready = self._initStorage(self._config);
            return self._ready;
        }

        function initDriver(supportedDrivers) {
            return function () {
                var currentDriverIndex = 0;

                function driverPromiseLoop() {
                    while (currentDriverIndex < supportedDrivers.length) {
                        var driverName = supportedDrivers[currentDriverIndex];
                        currentDriverIndex++;

                        self._dbInfo = null;
                        self._ready = null;

                        return self.getDriver(driverName).then(extendSelfWithDriver)["catch"](driverPromiseLoop);
                    }

                    setDriverToConfig();
                    var error = new Error('No available storage method found.');
                    self._driverSet = Promise$1.reject(error);
                    return self._driverSet;
                }

                return driverPromiseLoop();
            };
        }

        // There might be a driver initialization in progress
        // so wait for it to finish in order to avoid a possible
        // race condition to set _dbInfo
        var oldDriverSetDone = this._driverSet !== null ? this._driverSet["catch"](function () {
            return Promise$1.resolve();
        }) : Promise$1.resolve();

        this._driverSet = oldDriverSetDone.then(function () {
            var driverName = supportedDrivers[0];
            self._dbInfo = null;
            self._ready = null;

            return self.getDriver(driverName).then(function (driver) {
                self._driver = driver._driver;
                setDriverToConfig();
                self._wrapLibraryMethodsWithReady();
                self._initDriver = initDriver(supportedDrivers);
            });
        })["catch"](function () {
            setDriverToConfig();
            var error = new Error('No available storage method found.');
            self._driverSet = Promise$1.reject(error);
            return self._driverSet;
        });

        executeTwoCallbacks(this._driverSet, callback, errorCallback);
        return this._driverSet;
    };

    LocalForage.prototype.supports = function supports(driverName) {
        return !!DriverSupport[driverName];
    };

    LocalForage.prototype._extend = function _extend(libraryMethodsAndProperties) {
        extend(this, libraryMethodsAndProperties);
    };

    LocalForage.prototype._getSupportedDrivers = function _getSupportedDrivers(drivers) {
        var supportedDrivers = [];
        for (var i = 0, len = drivers.length; i < len; i++) {
            var driverName = drivers[i];
            if (this.supports(driverName)) {
                supportedDrivers.push(driverName);
            }
        }
        return supportedDrivers;
    };

    LocalForage.prototype._wrapLibraryMethodsWithReady = function _wrapLibraryMethodsWithReady() {
        // Add a stub for each driver API method that delays the call to the
        // corresponding driver method until localForage is ready. These stubs
        // will be replaced by the driver methods as soon as the driver is
        // loaded, so there is no performance impact.
        for (var i = 0, len = LibraryMethods.length; i < len; i++) {
            callWhenReady(this, LibraryMethods[i]);
        }
    };

    LocalForage.prototype.createInstance = function createInstance(options) {
        return new LocalForage(options);
    };

    return LocalForage;
}();

// The actual localForage object that we expose as a module or via a
// global. It's extended by pulling in one of our other libraries.


var localforage_js = new LocalForage();

module.exports = localforage_js;

},{"3":3}]},{},[4])(4)
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],9:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _EventBus = _dereq_(10);

var _EventBus2 = _interopRequireDefault(_EventBus);

var _eventsEvents = _dereq_(17);

var _eventsEvents2 = _interopRequireDefault(_eventsEvents);

var _FactoryMaker = _dereq_(11);

var _FactoryMaker2 = _interopRequireDefault(_FactoryMaker);

var LOG_LEVEL_NONE = 0;
var LOG_LEVEL_FATAL = 1;
var LOG_LEVEL_ERROR = 2;
var LOG_LEVEL_WARNING = 3;
var LOG_LEVEL_INFO = 4;
var LOG_LEVEL_DEBUG = 5;

/**
 * @module Debug
 * @param {object} config
 * @ignore
 */
function Debug(config) {

    config = config || {};
    var context = this.context;
    var eventBus = (0, _EventBus2['default'])(context).getInstance();
    var settings = config.settings;

    var logFn = [];

    var instance = undefined,
        showLogTimestamp = undefined,
        showCalleeName = undefined,
        startTime = undefined;

    function setup() {
        showLogTimestamp = true;
        showCalleeName = true;
        startTime = new Date().getTime();

        if (typeof window !== 'undefined' && window.console) {
            logFn[LOG_LEVEL_FATAL] = getLogFn(window.console.error);
            logFn[LOG_LEVEL_ERROR] = getLogFn(window.console.error);
            logFn[LOG_LEVEL_WARNING] = getLogFn(window.console.warn);
            logFn[LOG_LEVEL_INFO] = getLogFn(window.console.info);
            logFn[LOG_LEVEL_DEBUG] = getLogFn(window.console.debug);
        }
    }

    function getLogFn(fn) {
        if (fn && fn.bind) {
            return fn.bind(window.console);
        }
        // if not define, return the default function for reporting logs
        return window.console.log.bind(window.console);
    }

    /**
     * Retrieves a logger which can be used to write logging information in browser console.
     * @param {object} instance Object for which the logger is created. It is used
     * to include calle object information in log messages.
     * @memberof module:Debug
     * @returns {Logger}
     * @instance
     */
    function getLogger(instance) {
        return {
            fatal: fatal.bind(instance),
            error: error.bind(instance),
            warn: warn.bind(instance),
            info: info.bind(instance),
            debug: debug.bind(instance)
        };
    }

    /**
     * Prepends a timestamp in milliseconds to each log message.
     * @param {boolean} value Set to true if you want to see a timestamp in each log message.
     * @default LOG_LEVEL_WARNING
     * @memberof module:Debug
     * @instance
     */
    function setLogTimestampVisible(value) {
        showLogTimestamp = value;
    }

    /**
     * Prepends the callee object name, and media type if available, to each log message.
     * @param {boolean} value Set to true if you want to see the callee object name and media type in each log message.
     * @default true
     * @memberof module:Debug
     * @instance
     */
    function setCalleeNameVisible(value) {
        showCalleeName = value;
    }

    function fatal() {
        for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
            params[_key] = arguments[_key];
        }

        doLog.apply(undefined, [LOG_LEVEL_FATAL, this].concat(params));
    }

    function error() {
        for (var _len2 = arguments.length, params = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            params[_key2] = arguments[_key2];
        }

        doLog.apply(undefined, [LOG_LEVEL_ERROR, this].concat(params));
    }

    function warn() {
        for (var _len3 = arguments.length, params = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
            params[_key3] = arguments[_key3];
        }

        doLog.apply(undefined, [LOG_LEVEL_WARNING, this].concat(params));
    }

    function info() {
        for (var _len4 = arguments.length, params = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
            params[_key4] = arguments[_key4];
        }

        doLog.apply(undefined, [LOG_LEVEL_INFO, this].concat(params));
    }

    function debug() {
        for (var _len5 = arguments.length, params = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
            params[_key5] = arguments[_key5];
        }

        doLog.apply(undefined, [LOG_LEVEL_DEBUG, this].concat(params));
    }

    function doLog(level, _this) {
        var message = '';
        var logTime = null;

        if (showLogTimestamp) {
            logTime = new Date().getTime();
            message += '[' + (logTime - startTime) + ']';
        }

        if (showCalleeName && _this && _this.getClassName) {
            message += '[' + _this.getClassName() + ']';
            if (_this.getType) {
                message += '[' + _this.getType() + ']';
            }
        }

        if (message.length > 0) {
            message += ' ';
        }

        for (var _len6 = arguments.length, params = Array(_len6 > 2 ? _len6 - 2 : 0), _key6 = 2; _key6 < _len6; _key6++) {
            params[_key6 - 2] = arguments[_key6];
        }

        Array.apply(null, params).forEach(function (item) {
            message += item + ' ';
        });

        // log to console if the log level is high enough
        if (logFn[level] && settings.get().debug.logLevel >= level) {
            logFn[level](message);
        }

        // send log event regardless of log level
        if (settings && settings.get().debug.dispatchEvent) {
            eventBus.trigger(_eventsEvents2['default'].LOG, { message: message, level: level });
        }
    }

    instance = {
        getLogger: getLogger,
        setLogTimestampVisible: setLogTimestampVisible,
        setCalleeNameVisible: setCalleeNameVisible
    };

    setup();

    return instance;
}

Debug.__dashjs_factory_name = 'Debug';

var factory = _FactoryMaker2['default'].getSingletonFactory(Debug);
factory.LOG_LEVEL_NONE = LOG_LEVEL_NONE;
factory.LOG_LEVEL_FATAL = LOG_LEVEL_FATAL;
factory.LOG_LEVEL_ERROR = LOG_LEVEL_ERROR;
factory.LOG_LEVEL_WARNING = LOG_LEVEL_WARNING;
factory.LOG_LEVEL_INFO = LOG_LEVEL_INFO;
factory.LOG_LEVEL_DEBUG = LOG_LEVEL_DEBUG;
_FactoryMaker2['default'].updateSingletonFactory(Debug.__dashjs_factory_name, factory);
exports['default'] = factory;
module.exports = exports['default'];

},{"10":10,"11":11,"17":17}],10:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _FactoryMaker = _dereq_(11);

var _FactoryMaker2 = _interopRequireDefault(_FactoryMaker);

var _streamingMediaPlayerEvents = _dereq_(64);

var _streamingMediaPlayerEvents2 = _interopRequireDefault(_streamingMediaPlayerEvents);

var EVENT_PRIORITY_LOW = 0;
var EVENT_PRIORITY_HIGH = 5000;

function EventBus() {

    var handlers = {};

    function on(type, listener, scope) {
        var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

        if (!type) {
            throw new Error('event type cannot be null or undefined');
        }
        if (!listener || typeof listener !== 'function') {
            throw new Error('listener must be a function: ' + listener);
        }

        var priority = options.priority || EVENT_PRIORITY_LOW;

        if (getHandlerIdx(type, listener, scope) >= 0) return;

        handlers[type] = handlers[type] || [];

        var handler = {
            callback: listener,
            scope: scope,
            priority: priority
        };

        if (scope && scope.getStreamId) {
            handler.streamId = scope.getStreamId();
        }
        if (scope && scope.getType) {
            handler.mediaType = scope.getType();
        }
        if (options && options.mode) {
            handler.mode = options.mode;
        }

        var inserted = handlers[type].some(function (item, idx) {
            if (item && priority > item.priority) {
                handlers[type].splice(idx, 0, handler);
                return true;
            }
        });

        if (!inserted) {
            handlers[type].push(handler);
        }
    }

    function off(type, listener, scope) {
        if (!type || !listener || !handlers[type]) return;
        var idx = getHandlerIdx(type, listener, scope);
        if (idx < 0) return;
        handlers[type][idx] = null;
    }

    function trigger(type) {
        var payload = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var filters = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

        if (!type || !handlers[type]) return;

        payload = payload || {};

        if (payload.hasOwnProperty('type')) throw new Error('\'type\' is a reserved word for event dispatching');

        payload.type = type;

        if (filters.streamId) {
            payload.streamId = filters.streamId;
        }
        if (filters.mediaType) {
            payload.mediaType = filters.mediaType;
        }

        handlers[type].filter(function (handler) {
            if (!handler) {
                return false;
            }
            if (filters.streamId && handler.streamId && handler.streamId !== filters.streamId) {
                return false;
            }
            if (filters.mediaType && handler.mediaType && handler.mediaType !== filters.mediaType) {
                return false;
            }
            // This is used for dispatching DASH events. By default we use the onStart mode. Consequently we filter everything that has a non matching mode and the onReceive events for handlers that did not specify a mode.
            if (filters.mode && handler.mode && handler.mode !== filters.mode || !handler.mode && filters.mode && filters.mode === _streamingMediaPlayerEvents2['default'].EVENT_MODE_ON_RECEIVE) {
                return false;
            }
            return true;
        }).forEach(function (handler) {
            return handler && handler.callback.call(handler.scope, payload);
        });
    }

    function getHandlerIdx(type, listener, scope) {

        var idx = -1;

        if (!handlers[type]) return idx;

        handlers[type].some(function (item, index) {
            if (item && item.callback === listener && (!scope || scope === item.scope)) {
                idx = index;
                return true;
            }
        });
        return idx;
    }

    function reset() {
        handlers = {};
    }

    var instance = {
        on: on,
        off: off,
        trigger: trigger,
        reset: reset
    };

    return instance;
}

EventBus.__dashjs_factory_name = 'EventBus';
var factory = _FactoryMaker2['default'].getSingletonFactory(EventBus);
factory.EVENT_PRIORITY_LOW = EVENT_PRIORITY_LOW;
factory.EVENT_PRIORITY_HIGH = EVENT_PRIORITY_HIGH;
_FactoryMaker2['default'].updateSingletonFactory(EventBus.__dashjs_factory_name, factory);
exports['default'] = factory;
module.exports = exports['default'];

},{"11":11,"64":64}],11:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @module FactoryMaker
 * @ignore
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var FactoryMaker = (function () {

    var instance = undefined;
    var singletonContexts = [];
    var singletonFactories = {};
    var classFactories = {};

    function extend(name, childInstance, override, context) {
        if (!context[name] && childInstance) {
            context[name] = {
                instance: childInstance,
                override: override
            };
        }
    }

    /**
     * Use this method from your extended object.  this.factory is injected into your object.
     * this.factory.getSingletonInstance(this.context, 'VideoModel')
     * will return the video model for use in the extended object.
     *
     * @param {Object} context - injected into extended object as this.context
     * @param {string} className - string name found in all dash.js objects
     * with name __dashjs_factory_name Will be at the bottom. Will be the same as the object's name.
     * @returns {*} Context aware instance of specified singleton name.
     * @memberof module:FactoryMaker
     * @instance
     */
    function getSingletonInstance(context, className) {
        for (var i in singletonContexts) {
            var obj = singletonContexts[i];
            if (obj.context === context && obj.name === className) {
                return obj.instance;
            }
        }
        return null;
    }

    /**
     * Use this method to add an singleton instance to the system.  Useful for unit testing to mock objects etc.
     *
     * @param {Object} context
     * @param {string} className
     * @param {Object} instance
     * @memberof module:FactoryMaker
     * @instance
     */
    function setSingletonInstance(context, className, instance) {
        for (var i in singletonContexts) {
            var obj = singletonContexts[i];
            if (obj.context === context && obj.name === className) {
                singletonContexts[i].instance = instance;
                return;
            }
        }
        singletonContexts.push({
            name: className,
            context: context,
            instance: instance
        });
    }

    /**
     * Use this method to remove all singleton instances associated with a particular context.
     *
     * @param {Object} context
     * @memberof module:FactoryMaker
     * @instance
     */
    function deleteSingletonInstances(context) {
        singletonContexts = singletonContexts.filter(function (x) {
            return x.context !== context;
        });
    }

    /*------------------------------------------------------------------------------------------*/

    // Factories storage Management

    /*------------------------------------------------------------------------------------------*/

    function getFactoryByName(name, factoriesArray) {
        return factoriesArray[name];
    }

    function updateFactory(name, factory, factoriesArray) {
        if (name in factoriesArray) {
            factoriesArray[name] = factory;
        }
    }

    /*------------------------------------------------------------------------------------------*/

    // Class Factories Management

    /*------------------------------------------------------------------------------------------*/

    function updateClassFactory(name, factory) {
        updateFactory(name, factory, classFactories);
    }

    function getClassFactoryByName(name) {
        return getFactoryByName(name, classFactories);
    }

    function getClassFactory(classConstructor) {
        var factory = getFactoryByName(classConstructor.__dashjs_factory_name, classFactories);

        if (!factory) {
            factory = function (context) {
                if (context === undefined) {
                    context = {};
                }
                return {
                    create: function create() {
                        return merge(classConstructor, context, arguments);
                    }
                };
            };

            classFactories[classConstructor.__dashjs_factory_name] = factory; // store factory
        }
        return factory;
    }

    /*------------------------------------------------------------------------------------------*/

    // Singleton Factory MAangement

    /*------------------------------------------------------------------------------------------*/

    function updateSingletonFactory(name, factory) {
        updateFactory(name, factory, singletonFactories);
    }

    function getSingletonFactoryByName(name) {
        return getFactoryByName(name, singletonFactories);
    }

    function getSingletonFactory(classConstructor) {
        var factory = getFactoryByName(classConstructor.__dashjs_factory_name, singletonFactories);
        if (!factory) {
            factory = function (context) {
                var instance = undefined;
                if (context === undefined) {
                    context = {};
                }
                return {
                    getInstance: function getInstance() {
                        // If we don't have an instance yet check for one on the context
                        if (!instance) {
                            instance = getSingletonInstance(context, classConstructor.__dashjs_factory_name);
                        }
                        // If there's no instance on the context then create one
                        if (!instance) {
                            instance = merge(classConstructor, context, arguments);
                            singletonContexts.push({
                                name: classConstructor.__dashjs_factory_name,
                                context: context,
                                instance: instance
                            });
                        }
                        return instance;
                    }
                };
            };
            singletonFactories[classConstructor.__dashjs_factory_name] = factory; // store factory
        }

        return factory;
    }

    function merge(classConstructor, context, args) {

        var classInstance = undefined;
        var className = classConstructor.__dashjs_factory_name;
        var extensionObject = context[className];

        if (extensionObject) {

            var extension = extensionObject.instance;

            if (extensionObject.override) {
                //Override public methods in parent but keep parent.

                classInstance = classConstructor.apply({ context: context }, args);
                extension = extension.apply({
                    context: context,
                    factory: instance,
                    parent: classInstance
                }, args);

                for (var prop in extension) {
                    if (classInstance.hasOwnProperty(prop)) {
                        classInstance[prop] = extension[prop];
                    }
                }
            } else {
                //replace parent object completely with new object. Same as dijon.

                return extension.apply({
                    context: context,
                    factory: instance
                }, args);
            }
        } else {
            // Create new instance of the class
            classInstance = classConstructor.apply({ context: context }, args);
        }

        // Add getClassName function to class instance prototype (used by Debug)
        classInstance.getClassName = function () {
            return className;
        };

        return classInstance;
    }

    instance = {
        extend: extend,
        getSingletonInstance: getSingletonInstance,
        setSingletonInstance: setSingletonInstance,
        deleteSingletonInstances: deleteSingletonInstances,
        getSingletonFactory: getSingletonFactory,
        getSingletonFactoryByName: getSingletonFactoryByName,
        updateSingletonFactory: updateSingletonFactory,
        getClassFactory: getClassFactory,
        getClassFactoryByName: getClassFactoryByName,
        updateClassFactory: updateClassFactory
    };

    return instance;
})();

exports["default"] = FactoryMaker;
module.exports = exports["default"];

},{}],12:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _FactoryMaker = _dereq_(11);

var _FactoryMaker2 = _interopRequireDefault(_FactoryMaker);

var _UtilsJs = _dereq_(13);

var _UtilsJs2 = _interopRequireDefault(_UtilsJs);

var _coreDebug = _dereq_(9);

var _coreDebug2 = _interopRequireDefault(_coreDebug);

var _streamingConstantsConstants = _dereq_(65);

var _streamingConstantsConstants2 = _interopRequireDefault(_streamingConstantsConstants);

var _streamingVoMetricsHTTPRequest = _dereq_(87);

/** @module Settings
 * @description Define the configuration parameters of Dash.js MediaPlayer.
 * @see {@link module:Settings~PlayerSettings PlayerSettings} for further information about the supported configuration properties.
 */

/**
 * @typedef {Object} PlayerSettings
 * @property {module:Settings~DebugSettings} [debug]
 * Debug related settings.
 * @property {module:Settings~StreamingSettings} [streaming]
 * Streaming related settings.
 * @example
 *
 * // Full settings object
 * settings = {
 *      debug: {
 *          logLevel: Debug.LOG_LEVEL_WARNING,
 *          dispatchEvent: false
 *      },
 *      streaming: {
 *          metricsMaxListDepth: 1000,
 *          abandonLoadTimeout: 10000,
 *          liveDelayFragmentCount: NaN,
 *          liveDelay: null,
 *          scheduleWhilePaused: true,
 *          fastSwitchEnabled: false,
 *          flushBufferAtTrackSwitch: false,
 *          calcSegmentAvailabilityRangeFromTimeline: false,
 *          reuseExistingSourceBuffers: true,
 *          bufferPruningInterval: 10,
 *          bufferToKeep: 20,
 *          jumpGaps: true,
 *          jumpLargeGaps: true,
 *          smallGapLimit: 1.5,
 *          stableBufferTime: 12,
 *          bufferTimeAtTopQuality: 30,
 *          bufferTimeAtTopQualityLongForm: 60,
 *          longFormContentDurationThreshold: 600,
 *          wallclockTimeUpdateInterval: 50,
 *          lowLatencyEnabled: false,
 *          keepProtectionMediaKeys: false,
 *          useManifestDateHeaderTimeSource: true,
 *          useSuggestedPresentationDelay: true,
 *          useAppendWindow: true,
 *          manifestUpdateRetryInterval: 100,
 *          stallThreshold: 0.5,
 *          filterUnsupportedEssentialProperties: true,
 *          utcSynchronization: {
 *              backgroundAttempts: 2,
 *              timeBetweenSyncAttempts: 30,
 *              maximumTimeBetweenSyncAttempts: 600,
 *              minimumTimeBetweenSyncAttempts: 2,
 *              timeBetweenSyncAttemptsAdjustmentFactor: 2,
 *              maximumAllowedDrift: 100,
 *              enableBackgroundSyncAfterSegmentDownloadError: true,
 *              defaultTimingSource: {
 *                   scheme: 'urn:mpeg:dash:utc:http-xsdate:2014',
 *                   value: 'http://time.akamai.com/?iso&ms'
 *               }
 *          },
 *          liveCatchup: {
 *              minDrift: 0.02,
 *              maxDrift: 0,
 *              playbackRate: 0.5,
 *              latencyThreshold: NaN,
 *              playbackBufferMin: NaN,
 *              enabled: false,
 *              mode: Constants.LIVE_CATCHUP_MODE_DEFAULT
 *           },
 *          lastBitrateCachingInfo: { enabled: true, ttl: 360000 },
 *          lastMediaSettingsCachingInfo: { enabled: true, ttl: 360000 },
 *          cacheLoadThresholds: { video: 50, audio: 5 },
 *          trackSwitchMode: {
 *              audio: Constants.TRACK_SWITCH_MODE_ALWAYS_REPLACE,
 *              video: Constants.TRACK_SWITCH_MODE_NEVER_REPLACE
 *          },
 *          selectionModeForInitialTrack: Constants.TRACK_SELECTION_MODE_HIGHEST_BITRATE,
 *          fragmentRequestTimeout: 0,
 *          retryIntervals: {
 *              MPD: 500,
 *              XLinkExpansion: 500,
 *              InitializationSegment: 1000,
 *              IndexSegment: 1000,
 *              MediaSegment: 1000,
 *              BitstreamSwitchingSegment: 1000,
 *              other: 1000,
 *              lowLatencyReductionFactor: 10
 *          },
 *          retryAttempts: {
 *              MPD: 3,
 *              XLinkExpansion: 1,
 *              InitializationSegment: 3,
 *              IndexSegment: 3,
 *              MediaSegment: 3,
 *              BitstreamSwitchingSegment: 3,
 *              other: 3,
 *              lowLatencyMultiplyFactor: 5
 *          },
 *          abr: {
 *              movingAverageMethod: Constants.MOVING_AVERAGE_SLIDING_WINDOW,
 *              ABRStrategy: Constants.ABR_STRATEGY_DYNAMIC,
 *              bandwidthSafetyFactor: 0.9,
 *              useDefaultABRRules: true,
 *              useDeadTimeLatency: true,
 *              limitBitrateByPortal: false,
 *              usePixelRatioInLimitBitrateByPortal: false,
 *              maxBitrate: { audio: -1, video: -1 },
 *              minBitrate: { audio: -1, video: -1 },
 *              maxRepresentationRatio: { audio: 1, video: 1 },
 *              initialBitrate: { audio: -1, video: -1 },
 *              initialRepresentationRatio: { audio: -1, video: -1 },
 *              autoSwitchBitrate: { audio: true, video: true },
 *              fetchThroughputCalculationMode: Constants.ABR_FETCH_THROUGHPUT_CALCULATION_DOWNLOADED_DATA
 *          },
 *          cmcd: {
 *              enabled: false,
 *              sid: null,
 *              cid: null,
 *              rtp: null,
 *              rtpSafetyFactor: 5
 *          }
 *      }
 * }
 */

/**
 * @typedef {Object} DebugSettings
 * @property {number} [logLevel=dashjs.Debug.LOG_LEVEL_WARNING]
 * Sets up the log level. The levels are cumulative.
 *
 * For example, if you set the log level to dashjs.Debug.LOG_LEVEL_WARNING all warnings, errors and fatals will be logged.
 *
 * Possible values.
 *
 * - dashjs.Debug.LOG_LEVEL_NONE
 * No message is written in the browser console.
 *
 * - dashjs.Debug.LOG_LEVEL_FATAL
 * Log fatal errors.
 * An error is considered fatal when it causes playback to fail completely.
 *
 * - dashjs.Debug.LOG_LEVEL_ERROR
 * Log error messages.
 *
 * - dashjs.Debug.LOG_LEVEL_WARNING
 * Log warning messages.
 *
 * - dashjs.Debug.LOG_LEVEL_INFO
 * Log info messages.
 *
 * - dashjs.Debug.LOG_LEVEL_DEBUG
 * Log debug messages.
 * @property {boolean} [dispatchEvent=false]
 * Enable to trigger a Events.LOG event whenever log output is generated.
 *
 * Note this will be dispatched regardless of log level.
 */

/**
 * @typedef {Object} AbrSettings
 * @property {string} [movingAverageMethod="slidingWindow"]
 * Sets the moving average method used for smoothing throughput estimates.
 *
 * Valid methods are "slidingWindow" and "ewma".
 *
 * The call has no effect if an invalid method is passed.
 *
 * The sliding window moving average method computes the average throughput using the last four segments downloaded.
 *
 * If the stream is live (as opposed to VOD), then only the last three segments are used.
 *
 * If wide variations in throughput are detected, the number of segments can be dynamically increased to avoid oscillations.
 *
 * The exponentially weighted moving average (EWMA) method computes the average using exponential smoothing.
 *
 * Two separate estimates are maintained, a fast one with a three-second half life and a slow one with an eight-second half life.
 *
 * The throughput estimate at any time is the minimum of the fast and slow estimates.
 *
 * This allows a fast reaction to a bandwidth drop and prevents oscillations on bandwidth spikes.
 * @property {string} [ABRStrategy="abrDynamic"]
 * Returns the current ABR strategy being used: "abrDynamic", "abrBola" or "abrThroughput".
 * @property {number} [bandwidthSafetyFactor=0.9]
 * Standard ABR throughput rules multiply the throughput by this value.
 *
 * It should be between 0 and 1, with lower values giving less rebuffering (but also lower quality).
 * @property {boolean} [useDefaultABRRules=true]
 * Should the default ABR rules be used, or the custom ones added.
 * @property {boolean} [useDeadTimeLatency=true]
 * If true, only the download portion will be considered part of the download bitrate and latency will be regarded as static.
 *
 * If false, the reciprocal of the whole transfer time will be used.
 * @property {boolean} [limitBitrateByPortal=false]
 * If true, the size of the video portal will limit the max chosen video resolution.
 * @property {boolean} [usePixelRatioInLimitBitrateByPortal=false]
 * Sets whether to take into account the device's pixel ratio when defining the portal dimensions.
 *
 * Useful on, for example, retina displays.
 * @property {module:Settings~AudioVideoSettings} [maxBitrate={audio: -1, video: -1}]
 * The maximum bitrate that the ABR algorithms will choose.
 *
 * Use NaN for no limit.
 * @property {module:Settings~AudioVideoSettings} [minBitrate={audio: -1, video: -1}]
 * The minimum bitrate that the ABR algorithms will choose.
 *
 * Use NaN for no limit.
 * @property {module:Settings~AudioVideoSettings} [maxRepresentationRatio={audio: 1, video: 1}]
 * When switching multi-bitrate content (auto or manual mode) this property specifies the maximum representation allowed, as a proportion of the size of the representation set.
 *
 * You can set or remove this cap at anytime before or during playback.
 *
 * To clear this setting you set the value to 1.
 *
 * If both this and maxAllowedBitrate are defined, maxAllowedBitrate is evaluated first, then maxAllowedRepresentation, i.e. the lowest value from executing these rules is used.
 *
 * This feature is typically used to reserve higher representations for playback only when connected over a fast connection.
 * @property {module:Settings~AudioVideoSettings} [initialBitrate={audio: -1, video: -1}]
 * Explicitly set the starting bitrate for audio or video.
 * @property {module:Settings~AudioVideoSettings} [initialRepresentationRatio={audio: -1, video: -1}]
 * Explicitly set the initial representation ratio.
 *
 * If initalBitrate is specified, this is ignored.
 * @property {module:Settings~AudioVideoSettings} [autoSwitchBitrate={audio: true, video: true}]
 * Indicates whether the player should enable ABR algorithms to switch the bitrate.
 *
 * @property {string} [fetchThroughputCalculationMode="abrFetchThroughputCalculationDownloadedData"]
 * Algorithm to determine the throughput in case the Fetch API is used for low latency streaming.
 *
 * For details please check the samples section and FetchLoader.js.
 */

/**
 * @typedef {Object} StreamingSettings
 * @property {number} [metricsMaxListDepth=1000]
 * Maximum list depth of metrics.
 * @property {number} [abandonLoadTimeout=10000]
 * A timeout value in seconds, which during the ABRController will block switch-up events.
 *
 * This will only take effect after an abandoned fragment event occurs.
 * @property {number} [liveDelayFragmentCount=NaN]
 * Changing this value will lower or increase live stream latency.
 *
 * The detected segment duration will be multiplied by this value to define a time in seconds to delay a live stream from the live edge.
 *
 * Lowering this value will lower latency but may decrease the player's ability to build a stable buffer.
 * @property {number} [liveDelay]
 * Equivalent in seconds of setLiveDelayFragmentCount.
 *
 * Lowering this value will lower latency but may decrease the player's ability to build a stable buffer.
 *
 * This value should be less than the manifest duration by a couple of segment durations to avoid playback issues.
 *
 * If set, this parameter will take precedence over setLiveDelayFragmentCount and manifest info.
 * @property {boolean} [scheduleWhilePaused=true]
 * Set to true if you would like dash.js to keep downloading fragments in the background when the video element is paused.
 * @property {boolean} [fastSwitchEnabled=false]
 * When enabled, after an ABR up-switch in quality, instead of requesting and appending the next fragment at the end of the current buffer range it is requested and appended closer to the current time.
 *
 * When enabled, The maximum time to render a higher quality is current time + (1.5 * fragment duration).
 *
 * Note, When ABR down-switch is detected, we appended the lower quality at the end of the buffer range to preserve the
 * higher quality media for as long as possible.
 *
 * If enabled, it should be noted there are a few cases when the client will not replace inside buffer range but rather just append at the end.
 * 1. When the buffer level is less than one fragment duration.
 * 2. The client is in an Abandonment State due to recent fragment abandonment event.
 *
 * Known issues:
 * 1. In IE11 with auto switching off, if a user switches to a quality they can not download in time the fragment may be appended in the same range as the playhead or even in the past, in IE11 it may cause a stutter or stall in playback.
 * @property {boolean} [flushBufferAtTrackSwitch=false]
 * When enabled, after a track switch and in case buffer is being replaced (see MediaPlayer.setTrackSwitchModeFor(Constants.TRACK_SWITCH_MODE_ALWAYS_REPLACE)), the video element is flushed (seek at current playback time) once a segment of the new track is appended in buffer in order to force video decoder to play new track.
 *
 * This can be required on some devices like GoogleCast devices to make track switching functional.
 *
 * Otherwise track switching will be effective only once after previous buffered track is fully consumed.
 * @property {boolean} [calcSegmentAvailabilityRangeFromTimeline=false]
 * Enable calculation of the DVR window for SegmentTimeline manifests based on the entries in \<SegmentTimeline\>.
 * @property {boolean} [reuseExistingSourceBuffers=true]
 * Enable reuse of existing MediaSource Sourcebuffers during period transition.
 * @property {number} [bufferPruningInterval=10]
 * The interval of pruning buffer in seconds.
 * @property {number} [bufferToKeep=20]
 * This value influences the buffer pruning logic.
 *
 * Allows you to modify the buffer that is kept in source buffer in seconds.
 * 0|-----------bufferToPrune-----------|-----bufferToKeep-----|currentTime|
 * @property {boolean} [jumpGaps=true]
 * Sets whether player should jump small gaps (discontinuities) in the buffer.
 * @property {boolean} [jumpLargeGaps=true]
 * Sets whether player should jump large gaps (discontinuities) in the buffer.
 * @property {number} [smallGapLimit=1.8]
 * Time in seconds for a gap to be considered small.
 * @property {number} [stableBufferTime=12]
 * The time that the internal buffer target will be set to post startup/seeks (NOT top quality).
 *
 * When the time is set higher than the default you will have to wait longer to see automatic bitrate switches but will have a larger buffer which will increase stability.
 * @property {number} [bufferTimeAtTopQuality=30]
 * The time that the internal buffer target will be set to once playing the top quality.
 *
 * If there are multiple bitrates in your adaptation, and the media is playing at the highest bitrate, then we try to build a larger buffer at the top quality to increase stability and to maintain media quality.
 * @property {number} [bufferTimeAtTopQualityLongForm=60]
 * The time that the internal buffer target will be set to once playing the top quality for long form content.
 * @property {number} [longFormContentDurationThreshold=600]
 * The threshold which defines if the media is considered long form content.
 *
 * This will directly affect the buffer targets when playing back at the top quality.
 * @property {number} [wallclockTimeUpdateInterval=50]
 * How frequently the wallclockTimeUpdated internal event is triggered (in milliseconds).
 * @property {boolean} [lowLatencyEnabled=false]
 * Enable or disable low latency mode.
 * @property {boolean} [keepProtectionMediaKeys=false]
 * Set the value for the ProtectionController and MediaKeys life cycle.
 *
 * If true, the ProtectionController and then created MediaKeys and MediaKeySessions will be preserved during the MediaPlayer lifetime.
 * @property {boolean} [useManifestDateHeaderTimeSource=true]
 * Allows you to enable the use of the Date Header, if exposed with CORS, as a timing source for live edge detection.
 *
 * The use of the date header will happen only after the other timing source that take precedence fail or are omitted as described.
 * @property {boolean} [useSuggestedPresentationDelay=true]
 * Set to true if you would like to override the default live delay and honor the SuggestedPresentationDelay attribute in by the manifest.
 * @property {boolean} [useAppendWindow=true]
 * Specifies if the appendWindow attributes of the MSE SourceBuffers should be set according to content duration from manifest.
 * @property {number} [manifestUpdateRetryInterval=100]
 * For live streams, set the interval-frequency in milliseconds at which dash.js will check if the current manifest is still processed before downloading the next manifest once the minimumUpdatePeriod time has.
 * @property {number} [stallThreshold=0.5]
 * Stall threshold used in BufferController.js to determine whether a track should still be changed and which buffer range to prune.
 * @property {boolean} [filterUnsupportedEssentialProperties=true]
 * Enable to filter all the AdaptationSets and Representations which contain an unsupported \<EssentialProperty\> element.
 * @property {module:Settings~UtcSynchronizationSettings} utcSynchronization Settings related to UTC clock synchronization
 * @property {module:Settings~LiveCatchupSettings} liveCatchup  Settings related to live catchup.
 * @property {module:Settings~CachingInfoSettings} [lastBitrateCachingInfo={enabled: true, ttl: 360000}]
 * Set to false if you would like to disable the last known bit rate from being stored during playback and used to set the initial bit rate for subsequent playback within the expiration window.
 *
 * The default expiration is one hour, defined in milliseconds.
 *
 * If expired, the default initial bit rate (closest to 1000 kbps) will be used for that session and a new bit rate will be stored during that session.
 * @property {module:Settings~CachingInfoSettings} [lastMediaSettingsCachingInfo={enabled: true, ttl: 360000}]
 * Set to false if you would like to disable the last known lang for audio (or camera angle for video) from being stored during playback and used to set the initial settings for subsequent playback within the expiration window.
 *
 * The default expiration is one hour, defined in milliseconds.
 *
 * If expired, the default settings will be used for that session and a new settings will be stored during that session.
 * @property {module:Settings~AudioVideoSettings} [cacheLoadThresholds={video: 50, audio: 5}]
 * For a given media type, the threshold which defines if the response to a fragment request is coming from browser cache or not.
 * @property {module:Settings~AudioVideoSettings} [trackSwitchMode={video: "neverReplace", audio: "alwaysReplace"}]
 * For a given media type defines if existing segments in the buffer should be overwritten once the track is switched. For instance if the user switches the audio language the existing segments in the audio buffer will be replaced when setting this value to "alwaysReplace".
 *
 * Possible values
 *
 * - Constants.TRACK_SWITCH_MODE_ALWAYS_REPLACE
 * Replace existing segments in the buffer
 *
 * - Constants.TRACK_SWITCH_MODE_NEVER_REPLACE
 * Do not replace existing segments in the buffer
 *
 * @property {string} [selectionModeForInitialTrack="highestBitrate"]
 * Sets the selection mode for the initial track. This mode defines how the initial track will be selected if no initial media settings are set. If initial media settings are set this parameter will be ignored. Available options are:
 *
 * Possible values
 *
 * - Constants.TRACK_SELECTION_MODE_HIGHEST_BITRATE
 * This mode makes the player select the track with a highest bitrate. This mode is a default mode.
 *
 * - Constants.TRACK_SELECTION_MODE_HIGHEST_EFFICIENCY
 * This mode makes the player select the track with the lowest bitrate per pixel average.
 *
 * - Constants.TRACK_SELECTION_MODE_WIDEST_RANGE
 * This mode makes the player select the track with a widest range of bitrates.
 *
 *
 * @property {number} [fragmentRequestTimeout=0]
 * Time in milliseconds before timing out on loading a media fragment.
 *
 * Fragments that timeout are retried as if they failed.
 * @property {module:Settings~RequestTypeSettings} [retryIntervals]
 * Time in milliseconds of which to reload a failed file load attempt.
 *
 * For low latency mode these values are divided by lowLatencyReductionFactor.
 * @property {module:Settings~RequestTypeSettings} [retryAttempts]
 * Total number of retry attempts that will occur on a file load before it fails.
 *
 * For low latency mode these values are multiplied by lowLatencyMultiplyFactor.
 * @property {module:Settings~AbrSettings} abr
 * Adaptive Bitrate algorithm related settings.
 * @property {module:Settings~CmcdSettings} cmcd
 * Settings related to Common Media Client Data reporting.
 */

/**
 * @typedef {Object} CachingInfoSettings
 * @property {boolean} [enable]
 * Enable or disable the caching feature.
 * @property {number} [ttl]
 * Time to live.
 *
 * A value defined in milliseconds representing how log to cache the settings for.
 */

/**
 * @typedef {Object} module:Settings~AudioVideoSettings
 * @property {number|boolean|string} [audio]
 * Configuration for audio media type of tracks.
 * @property {number|boolean|string} [video]
 * Configuration for video media type of tracks.
 */

/**
 * @typedef {Object} RequestTypeSettings
 * @property {number} [MPD]
 * Manifest type of requests.
 * @property {number} [XLinkExpansion]
 * XLink expansion type of requests.
 * @property {number} [InitializationSegment]
 * Request to retrieve an initialization segment.
 * @property {number} [IndexSegment]
 * Request to retrieve an index segment (SegmentBase).
 * @property {number} [MediaSegment]
 * Request to retrieve a media segment (video/audio/image/text chunk).
 * @property {number} [BitstreamSwitchingSegment]
 * Bitrate stream switching type of request.
 * @property {number} [other]
 * Other type of request.
 * @property {number} [lowLatencyReductionFactor]
 * For low latency mode, values of type of request are divided by lowLatencyReductionFactor.
 *
 * Note: It's not type of request.
 * @property {number} [lowLatencyMultiplyFactor]
 * For low latency mode, values of type of request are multiplied by lowLatencyMultiplyFactor.
 *
 * Note: It's not type of request.
 */

/**
 * @typedef {Object} module:Settings~CmcdSettings
 * @property {boolean} [enable=false]
 * Enable or disable the CMCD reporting.
 * @property {string} [sid]
 * GUID identifying the current playback session.
 *
 * Should be in UUID format.
 *
 * If not specified a UUID will be automatically generated.
 * @property {string} [cid]
 * A unique string to identify the current content.
 *
 * If not specified it will be a hash of the MPD url.
 * @property {number} [rtp]
 * The requested maximum throughput that the client considers sufficient for delivery of the asset.
 *
 * If not specified this value will be dynamically calculated in the CMCDModel based on the current buffer level.
 * @property {number} [rtpSafetyFactor]
 * This value is used as a factor for the rtp value calculation: rtp = minBandwidth * rtpSafetyFactor
 *
 * If not specified this value defaults to 5. Note that this value is only used when no static rtp value is defined.
 */

/**
 * @typedef {Object} module:Settings~UtcSynchronizationSettings
 * @property {number} [backgroundAttempts=2]
 * Number of synchronization attempts to perform in the background after an initial synchronization request has been done. This is used to verify that the derived client-server offset is correct.
 *
 * The background requests are async and done in parallel to the start of the playback.
 *
 * This value is also used to perform a resync after 404 errors on segments.
 * @property {number} [timeBetweenSyncAttempts=30]
 * The time in seconds between two consecutive sync attempts.
 *
 * Note: This value is used as an initial starting value. The internal value of the TimeSyncController is adjusted during playback based on the drift between two consecutive synchronization attempts.
 *
 * Note: A sync is only performed after an MPD update. In case the @minimumUpdatePeriod is larger than this value the sync will be delayed until the next MPD update.
 * @property {number} [maximumTimeBetweenSyncAttempts=600]
 * The maximum time in seconds between two consecutive sync attempts.
 *
 * @property {number} [minimumTimeBetweenSyncAttempts=2]
 * The minimum time in seconds between two consecutive sync attempts.
 *
 * @property {number} [timeBetweenSyncAttemptsAdjustmentFactor=2]
 * The factor used to multiply or divide the timeBetweenSyncAttempts parameter after a sync. The maximumAllowedDrift defines whether this value is used as a factor or a dividend.
 *
 * @property {number} [maximumAllowedDrift=100]
 * The maximum allowed drift specified in milliseconds between two consecutive synchronization attempts.
 *
 * @property {boolean} [enableBackgroundSyncAfterSegmentDownloadError=true]
 * Enables or disables the background sync after the player ran into a segment download error.
 *
 * @property {object} [defaultTimingSource={scheme:'urn:mpeg:dash:utc:http-xsdate:2014',value: 'http://time.akamai.com/?iso&ms'}]
 * The default timing source to be used. The timing sources in the MPD take precedence over this one.
 */

/**
 * @typedef {Object} module:Settings~LiveCatchupSettings
 * @property {number} [minDrift=0.02]
 * Use this method to set the minimum latency deviation allowed before activating catch-up mechanism.
 *
 * In low latency mode, when the difference between the measured latency and the target one, as an absolute number, is higher than the one sets with this method, then dash.js increases/decreases playback rate until target latency is reached.
 *
 * LowLatencyMinDrift should be provided in seconds, and it uses values between 0.0 and 0.5.
 *
 * Note: Catch-up mechanism is only applied when playing low latency live streams.
 * @property {number} [maxDrift=0]
 * Use this method to set the maximum latency deviation allowed before dash.js to do a seeking to live position.
 *
 * In low latency mode, when the difference between the measured latency and the target one, as an absolute number, is higher than the one sets with this method, then dash.js does a seek to live edge position minus the target live delay.
 *
 * LowLatencyMaxDriftBeforeSeeking should be provided in seconds.
 *
 * If 0, then seeking operations won't be used for fixing latency deviations.
 *
 * Note: Catch-up mechanism is only applied when playing low latency live streams.
 * @property {number} [playbackRate=0.5]
 * Use this parameter to set the maximum catch up rate, as a percentage, for low latency live streams.
 *
 * In low latency mode, when measured latency is higher/lower than the target one, dash.js increases/decreases playback rate respectively up to (+/-) the percentage defined with this method until target is reached.
 *
 * Valid values for catch up rate are in range 0-0.5 (0-50%).
 *
 * Set it to 0 to turn off live catch up feature.
 *
 * Note: Catch-up mechanism is only applied when playing low latency live streams.
 * @property {number} [latencyThreshold=NaN]
 * Use this parameter to set the maximum threshold for which live catch up is applied.
 *
 * For instance, if this value is set to 8 seconds, then live catchup is only applied if the current live latency is equal or below 8 seconds.
 *
 * The reason behind this parameter is to avoid an increase of the playback rate if the user seeks within the DVR window.
 *
 * If no value is specified this will be twice the maximum live delay.
 *
 * The maximum live delay is either specified in the manifest as part of a ServiceDescriptor or calculated the following:
 * maximumLiveDelay = targetDelay + liveCatchupMinDrift.
 *
 * @property {number} [playbackBufferMin=NaN]
 * Use this parameter to specify the minimum buffer which is used for LoL+ based playback rate reduction.
 *
 *
 * @property {boolean} [enabled=false]
 * Use this parameter to enable the catchup mode for non low-latency streams.
 *
 * @property {string} [mode="liveCatchupModeDefault"]
 * Use this parameter to switch between different catchup modes.
 *
 * Options: "liveCatchupModeDefault" or "liveCatchupModeLOLP".
 *
 * Note: Catch-up mechanism is automatically applied when playing low latency live streams.
 */

/**
 * @class
 * @ignore
 */
function Settings() {
    var _retryIntervals, _retryAttempts;

    var instance = undefined;

    /**
     * @const {PlayerSettings} defaultSettings
     * @ignore
     */
    var defaultSettings = {
        debug: {
            logLevel: _coreDebug2['default'].LOG_LEVEL_WARNING,
            dispatchEvent: false
        },
        info: {
            id: null,
            count: null,
            face: null,
            row: null,
            col: null,
            duration: null,
            width: null,
            height: null,
            location: { 'x': null, 'y': null, 'z': null },
            rotation: { 'rx': null, 'ry': null, 'rz': null },
            totalThroughputNeeded: false
        },
        streaming: {
            metricsMaxListDepth: 1000,
            abandonLoadTimeout: 10000,
            liveDelayFragmentCount: NaN,
            liveDelay: null,
            scheduleWhilePaused: true,
            fastSwitchEnabled: false,
            flushBufferAtTrackSwitch: false,
            calcSegmentAvailabilityRangeFromTimeline: false,
            reuseExistingSourceBuffers: true,
            bufferPruningInterval: 10,
            bufferToKeep: 20,
            jumpGaps: true,
            jumpLargeGaps: true,
            smallGapLimit: 1.5,
            stableBufferTime: 12,
            bufferTimeAtTopQuality: 30,
            bufferTimeAtTopQualityLongForm: 60,
            longFormContentDurationThreshold: 600,
            wallclockTimeUpdateInterval: 50,
            lowLatencyEnabled: false,
            keepProtectionMediaKeys: false,
            useManifestDateHeaderTimeSource: true,
            useSuggestedPresentationDelay: true,
            useAppendWindow: true,
            manifestUpdateRetryInterval: 100,
            stallThreshold: 0.5,
            filterUnsupportedEssentialProperties: true,
            utcSynchronization: {
                backgroundAttempts: 2,
                timeBetweenSyncAttempts: 30,
                maximumTimeBetweenSyncAttempts: 600,
                minimumTimeBetweenSyncAttempts: 2,
                timeBetweenSyncAttemptsAdjustmentFactor: 2,
                maximumAllowedDrift: 100,
                enableBackgroundSyncAfterSegmentDownloadError: true,
                defaultTimingSource: {
                    scheme: 'urn:mpeg:dash:utc:http-xsdate:2014',
                    value: 'http://time.akamai.com/?iso&ms'
                }
            },
            liveCatchup: {
                minDrift: 0.02,
                maxDrift: 0,
                playbackRate: 0.5,
                latencyThreshold: 60,
                playbackBufferMin: 0.5,
                enabled: false,
                mode: _streamingConstantsConstants2['default'].LIVE_CATCHUP_MODE_DEFAULT
            },
            lastBitrateCachingInfo: { enabled: true, ttl: 360000 },
            lastMediaSettingsCachingInfo: { enabled: true, ttl: 360000 },
            cacheLoadThresholds: { video: 50, audio: 5 },
            trackSwitchMode: {
                audio: _streamingConstantsConstants2['default'].TRACK_SWITCH_MODE_ALWAYS_REPLACE,
                video: _streamingConstantsConstants2['default'].TRACK_SWITCH_MODE_NEVER_REPLACE
            },
            selectionModeForInitialTrack: _streamingConstantsConstants2['default'].TRACK_SELECTION_MODE_HIGHEST_BITRATE,
            fragmentRequestTimeout: 0,
            retryIntervals: (_retryIntervals = {}, _defineProperty(_retryIntervals, _streamingVoMetricsHTTPRequest.HTTPRequest.MPD_TYPE, 500), _defineProperty(_retryIntervals, _streamingVoMetricsHTTPRequest.HTTPRequest.XLINK_EXPANSION_TYPE, 500), _defineProperty(_retryIntervals, _streamingVoMetricsHTTPRequest.HTTPRequest.MEDIA_SEGMENT_TYPE, 1000), _defineProperty(_retryIntervals, _streamingVoMetricsHTTPRequest.HTTPRequest.INIT_SEGMENT_TYPE, 1000), _defineProperty(_retryIntervals, _streamingVoMetricsHTTPRequest.HTTPRequest.BITSTREAM_SWITCHING_SEGMENT_TYPE, 1000), _defineProperty(_retryIntervals, _streamingVoMetricsHTTPRequest.HTTPRequest.INDEX_SEGMENT_TYPE, 1000), _defineProperty(_retryIntervals, _streamingVoMetricsHTTPRequest.HTTPRequest.OTHER_TYPE, 1000), _defineProperty(_retryIntervals, 'lowLatencyReductionFactor', 10), _retryIntervals),
            retryAttempts: (_retryAttempts = {}, _defineProperty(_retryAttempts, _streamingVoMetricsHTTPRequest.HTTPRequest.MPD_TYPE, 3), _defineProperty(_retryAttempts, _streamingVoMetricsHTTPRequest.HTTPRequest.XLINK_EXPANSION_TYPE, 1), _defineProperty(_retryAttempts, _streamingVoMetricsHTTPRequest.HTTPRequest.MEDIA_SEGMENT_TYPE, 3), _defineProperty(_retryAttempts, _streamingVoMetricsHTTPRequest.HTTPRequest.INIT_SEGMENT_TYPE, 3), _defineProperty(_retryAttempts, _streamingVoMetricsHTTPRequest.HTTPRequest.BITSTREAM_SWITCHING_SEGMENT_TYPE, 3), _defineProperty(_retryAttempts, _streamingVoMetricsHTTPRequest.HTTPRequest.INDEX_SEGMENT_TYPE, 3), _defineProperty(_retryAttempts, _streamingVoMetricsHTTPRequest.HTTPRequest.OTHER_TYPE, 3), _defineProperty(_retryAttempts, 'lowLatencyMultiplyFactor', 5), _retryAttempts),
            abr: {
                movingAverageMethod: _streamingConstantsConstants2['default'].MOVING_AVERAGE_SLIDING_WINDOW,
                ABRStrategy: _streamingConstantsConstants2['default'].ABR_STRATEGY_DYNAMIC,
                bandwidthSafetyFactor: 0.9,
                useDefaultABRRules: true,
                useDeadTimeLatency: true,
                limitBitrateByPortal: false,
                usePixelRatioInLimitBitrateByPortal: false,
                maxBitrate: { audio: -1, video: -1 },
                minBitrate: { audio: -1, video: -1 },
                maxRepresentationRatio: { audio: 1, video: 1 },
                initialBitrate: { audio: -1, video: -1 },
                initialRepresentationRatio: { audio: -1, video: -1 },
                autoSwitchBitrate: { audio: true, video: true },
                fetchThroughputCalculationMode: _streamingConstantsConstants2['default'].ABR_FETCH_THROUGHPUT_CALCULATION_DOWNLOADED_DATA
            },
            cmcd: {
                enabled: false,
                sid: null,
                cid: null,
                rtp: null,
                rtpSafetyFactor: 5
            }
        }
    };

    var settings = _UtilsJs2['default'].clone(defaultSettings);

    //Merge in the settings. If something exists in the new config that doesn't match the schema of the default config,
    //regard it as an error and log it.
    function mixinSettings(source, dest, path) {
        for (var n in source) {
            if (source.hasOwnProperty(n)) {
                if (dest.hasOwnProperty(n)) {
                    if (typeof source[n] === 'object' && source[n] !== null) {
                        mixinSettings(source[n], dest[n], path.slice() + n + '.');
                    } else {
                        dest[n] = _UtilsJs2['default'].clone(source[n]);
                    }
                }
            }
        }
    }

    /**
     * Return the settings object. Don't copy/store this object, you won't get updates.
     * @func
     * @instance
     */
    function get() {
        return settings;
    }

    /**
     * @func
     * @instance
     * @param {object} settingsObj - This should be a partial object of the Settings.Schema type. That is, fields defined should match the path (e.g.
     * settingsObj.streaming.abr.autoSwitchBitrate.audio -> defaultSettings.streaming.abr.autoSwitchBitrate.audio). Where an element's path does
     * not match it is ignored, and a warning is logged.
     *
     * Use to change the settings object. Any new values defined will overwrite the settings and anything undefined will not change.
     * Implementers of new settings should add it in an approriate namespace to the defaultSettings object and give it a default value (that is not undefined).
     *
     */
    function update(settingsObj) {
        if (typeof settingsObj === 'object') {
            mixinSettings(settingsObj, settings, '');
        }
    }

    /**
     * Resets the settings object. Everything is set to its default value.
     * @func
     * @instance
     *
     */
    function reset() {
        settings = _UtilsJs2['default'].clone(defaultSettings);
    }

    instance = {
        get: get,
        update: update,
        reset: reset
    };

    return instance;
}

Settings.__dashjs_factory_name = 'Settings';
var factory = _FactoryMaker2['default'].getSingletonFactory(Settings);
exports['default'] = factory;
module.exports = exports['default'];

},{"11":11,"13":13,"65":65,"87":87,"9":9}],13:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @class
 * @ignore
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Utils = (function () {
    function Utils() {
        _classCallCheck(this, Utils);
    }

    _createClass(Utils, null, [{
        key: 'mixin',
        value: function mixin(dest, source, copy) {
            var s = undefined;
            var empty = {};
            if (dest) {
                for (var _name in source) {
                    if (source.hasOwnProperty(_name)) {
                        s = source[_name];
                        if (!(_name in dest) || dest[_name] !== s && (!(_name in empty) || empty[_name] !== s)) {
                            if (typeof dest[_name] === 'object' && dest[_name] !== null) {
                                dest[_name] = Utils.mixin(dest[_name], s, copy);
                            } else {
                                dest[_name] = copy(s);
                            }
                        }
                    }
                }
            }
            return dest;
        }
    }, {
        key: 'clone',
        value: function clone(src) {
            if (!src || typeof src !== 'object') {
                return src; // anything
            }
            var r = undefined;
            if (src instanceof Array) {
                // array
                r = [];
                for (var i = 0, l = src.length; i < l; ++i) {
                    if (i in src) {
                        r.push(Utils.clone(src[i]));
                    }
                }
            } else {
                r = {};
            }
            return Utils.mixin(r, src, Utils.clone);
        }
    }, {
        key: 'addAditionalQueryParameterToUrl',
        value: function addAditionalQueryParameterToUrl(url, params) {
            try {
                var _ret = (function () {
                    if (!params || params.length === 0) {
                        return {
                            v: url
                        };
                    }

                    var modifiedUrl = new URL(url);

                    params.forEach(function (param) {
                        if (param.key && param.value) {
                            modifiedUrl.searchParams.set(param.key, param.value);
                        }
                    });

                    return {
                        v: modifiedUrl.href
                    };
                })();

                if (typeof _ret === 'object') return _ret.v;
            } catch (e) {
                return url;
            }
        }
    }, {
        key: 'parseHttpHeaders',
        value: function parseHttpHeaders(headerStr) {
            var headers = {};
            if (!headerStr) {
                return headers;
            }

            // Trim headerStr to fix a MS Edge bug with xhr.getAllResponseHeaders method
            // which send a string starting with a "\n" character
            var headerPairs = headerStr.trim().split('\r\n');
            for (var i = 0, ilen = headerPairs.length; i < ilen; i++) {
                var headerPair = headerPairs[i];
                var index = headerPair.indexOf(': ');
                if (index > 0) {
                    headers[headerPair.substring(0, index)] = headerPair.substring(index + 2);
                }
            }
            return headers;
        }
    }, {
        key: 'generateUuid',
        value: function generateUuid() {
            var dt = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (dt + Math.random() * 16) % 16 | 0;
                dt = Math.floor(dt / 16);
                return (c == 'x' ? r : r & 0x3 | 0x8).toString(16);
            });
            return uuid;
        }
    }, {
        key: 'generateHashCode',
        value: function generateHashCode(string) {
            var hash = 0;

            if (string.length === 0) {
                return hash;
            }

            for (var i = 0; i < string.length; i++) {
                var chr = string.charCodeAt(i);
                hash = (hash << 5) - hash + chr;
                hash |= 0;
            }
            return hash;
        }
    }]);

    return Utils;
})();

exports['default'] = Utils;
module.exports = exports['default'];

},{}],14:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ErrorsBase2 = _dereq_(15);

var _ErrorsBase3 = _interopRequireDefault(_ErrorsBase2);

/**
 * Errors declaration
 * @class
 */

var Errors = (function (_ErrorsBase) {
  _inherits(Errors, _ErrorsBase);

  function Errors() {
    _classCallCheck(this, Errors);

    _get(Object.getPrototypeOf(Errors.prototype), 'constructor', this).call(this);
    /**
     * Error code returned when a manifest parsing error occurs
     */
    this.MANIFEST_LOADER_PARSING_FAILURE_ERROR_CODE = 10;
    /**
     * Error code returned when a manifest loading error occurs
     */
    this.MANIFEST_LOADER_LOADING_FAILURE_ERROR_CODE = 11;
    /**
     * Error code returned when a xlink loading error occurs
     */
    this.XLINK_LOADER_LOADING_FAILURE_ERROR_CODE = 12;
    /**
     * Error code returned when the update of segments list has failed
     */
    this.SEGMENTS_UPDATE_FAILED_ERROR_CODE = 13;
    this.SEGMENTS_UNAVAILABLE_ERROR_CODE = 14;
    this.SEGMENT_BASE_LOADER_ERROR_CODE = 15;
    this.TIME_SYNC_FAILED_ERROR_CODE = 16;
    this.FRAGMENT_LOADER_LOADING_FAILURE_ERROR_CODE = 17;
    this.FRAGMENT_LOADER_NULL_REQUEST_ERROR_CODE = 18;
    this.URL_RESOLUTION_FAILED_GENERIC_ERROR_CODE = 19;
    this.APPEND_ERROR_CODE = 20;
    this.REMOVE_ERROR_CODE = 21;
    this.DATA_UPDATE_FAILED_ERROR_CODE = 22;
    /**
     * Error code returned when MediaSource is not supported by the browser
     */
    this.CAPABILITY_MEDIASOURCE_ERROR_CODE = 23;
    /**
     * Error code returned when Protected contents are not supported
     */
    this.CAPABILITY_MEDIAKEYS_ERROR_CODE = 24;

    this.DOWNLOAD_ERROR_ID_MANIFEST_CODE = 25;

    this.DOWNLOAD_ERROR_ID_SIDX_CODE = 26;
    this.DOWNLOAD_ERROR_ID_CONTENT_CODE = 27;

    this.DOWNLOAD_ERROR_ID_INITIALIZATION_CODE = 28;

    this.DOWNLOAD_ERROR_ID_XLINK_CODE = 29;

    this.MANIFEST_ERROR_ID_CODEC_CODE = 30;
    this.MANIFEST_ERROR_ID_PARSE_CODE = 31;

    /**
     * Error code returned when no stream (period) has been detected in the manifest
     */
    this.MANIFEST_ERROR_ID_NOSTREAMS_CODE = 32;
    /**
     * Error code returned when something wrong has append during subtitles parsing (TTML or VTT)
     */
    this.TIMED_TEXT_ERROR_ID_PARSE_CODE = 33;
    /**
     * Error code returned when a 'muxed' media type has been detected in the manifest. This type is not supported
     */
    this.MANIFEST_ERROR_ID_MULTIPLEXED_CODE = 34;
    /**
     * Error code returned when a media source type is not supported
     */
    this.MEDIASOURCE_TYPE_UNSUPPORTED_CODE = 35;

    this.MANIFEST_LOADER_PARSING_FAILURE_ERROR_MESSAGE = 'parsing failed for ';
    this.MANIFEST_LOADER_LOADING_FAILURE_ERROR_MESSAGE = 'Failed loading manifest: ';
    this.XLINK_LOADER_LOADING_FAILURE_ERROR_MESSAGE = 'Failed loading Xlink element: ';
    this.SEGMENTS_UPDATE_FAILED_ERROR_MESSAGE = 'Segments update failed';
    this.SEGMENTS_UNAVAILABLE_ERROR_MESSAGE = 'no segments are available yet';
    this.SEGMENT_BASE_LOADER_ERROR_MESSAGE = 'error loading segments';
    this.TIME_SYNC_FAILED_ERROR_MESSAGE = 'Failed to synchronize time';
    this.FRAGMENT_LOADER_NULL_REQUEST_ERROR_MESSAGE = 'request is null';
    this.URL_RESOLUTION_FAILED_GENERIC_ERROR_MESSAGE = 'Failed to resolve a valid URL';
    this.APPEND_ERROR_MESSAGE = 'chunk is not defined';
    this.REMOVE_ERROR_MESSAGE = 'buffer is not defined';
    this.DATA_UPDATE_FAILED_ERROR_MESSAGE = 'Data update failed';

    this.CAPABILITY_MEDIASOURCE_ERROR_MESSAGE = 'mediasource is not supported';
    this.CAPABILITY_MEDIAKEYS_ERROR_MESSAGE = 'mediakeys is not supported';
    this.TIMED_TEXT_ERROR_MESSAGE_PARSE = 'parsing error :';
    this.MEDIASOURCE_TYPE_UNSUPPORTED_MESSAGE = 'Error creating source buffer of type : ';
  }

  return Errors;
})(_ErrorsBase3['default']);

var errors = new Errors();
exports['default'] = errors;
module.exports = exports['default'];

},{"15":15}],15:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var ErrorsBase = (function () {
    function ErrorsBase() {
        _classCallCheck(this, ErrorsBase);
    }

    _createClass(ErrorsBase, [{
        key: 'extend',
        value: function extend(errors, config) {
            if (!errors) return;

            var override = config ? config.override : false;
            var publicOnly = config ? config.publicOnly : false;

            for (var err in errors) {
                if (!errors.hasOwnProperty(err) || this[err] && !override) continue;
                if (publicOnly && errors[err].indexOf('public_') === -1) continue;
                this[err] = errors[err];
            }
        }
    }]);

    return ErrorsBase;
})();

exports['default'] = ErrorsBase;
module.exports = exports['default'];

},{}],16:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _EventsBase2 = _dereq_(18);

var _EventsBase3 = _interopRequireDefault(_EventsBase2);

/**
 * These are internal events that should not be needed at the player level.
 * If you find and event in here that you would like access to from MediaPlayer level
 * please add an issue at https://github.com/Dash-Industry-Forum/dash.js/issues/new
 * @class
 * @ignore
 */

var CoreEvents = (function (_EventsBase) {
    _inherits(CoreEvents, _EventsBase);

    function CoreEvents() {
        _classCallCheck(this, CoreEvents);

        _get(Object.getPrototypeOf(CoreEvents.prototype), 'constructor', this).call(this);
        this.ATTEMPT_BACKGROUND_SYNC = 'attemptBackgroundSync';
        this.BUFFERING_COMPLETED = 'bufferingCompleted';
        this.BUFFER_CLEARED = 'bufferCleared';
        this.BUFFER_LEVEL_UPDATED = 'bufferLevelUpdated';
        this.BYTES_APPENDED = 'bytesAppended';
        this.BYTES_APPENDED_END_FRAGMENT = 'bytesAppendedEndFragment';
        this.CHECK_FOR_EXISTENCE_COMPLETED = 'checkForExistenceCompleted';
        this.CURRENT_TRACK_CHANGED = 'currentTrackChanged';
        this.DATA_UPDATE_COMPLETED = 'dataUpdateCompleted';
        this.DATA_UPDATE_STARTED = 'dataUpdateStarted';
        this.INBAND_EVENTS = 'inbandEvents';
        this.INITIALIZATION_LOADED = 'initializationLoaded';
        this.INIT_FRAGMENT_LOADED = 'initFragmentLoaded';
        this.INIT_FRAGMENT_NEEDED = 'initFragmentNeeded';
        this.INTERNAL_MANIFEST_LOADED = 'internalManifestLoaded';
        this.ORIGINAL_MANIFEST_LOADED = 'originalManifestLoaded';
        this.LIVE_EDGE_SEARCH_COMPLETED = 'liveEdgeSearchCompleted';
        this.LOADING_COMPLETED = 'loadingCompleted';
        this.LOADING_PROGRESS = 'loadingProgress';
        this.LOADING_DATA_PROGRESS = 'loadingDataProgress';
        this.LOADING_ABANDONED = 'loadingAborted';
        this.MANIFEST_UPDATED = 'manifestUpdated';
        this.MEDIA_FRAGMENT_LOADED = 'mediaFragmentLoaded';
        this.MEDIA_FRAGMENT_NEEDED = 'mediaFragmentNeeded';
        this.QUOTA_EXCEEDED = 'quotaExceeded';
        this.REPRESENTATION_UPDATE_STARTED = 'representationUpdateStarted';
        this.REPRESENTATION_UPDATE_COMPLETED = 'representationUpdateCompleted';
        this.SEGMENTS_LOADED = 'segmentsLoaded';
        this.SERVICE_LOCATION_BLACKLIST_ADD = 'serviceLocationBlacklistAdd';
        this.SERVICE_LOCATION_BLACKLIST_CHANGED = 'serviceLocationBlacklistChanged';
        this.SOURCEBUFFER_REMOVE_COMPLETED = 'sourceBufferRemoveCompleted';
        this.STREAMS_COMPOSED = 'streamsComposed';
        this.STREAM_BUFFERING_COMPLETED = 'streamBufferingCompleted';
        this.STREAM_COMPLETED = 'streamCompleted';
        this.TEXT_TRACKS_QUEUE_INITIALIZED = 'textTracksQueueInitialized';
        this.TIME_SYNCHRONIZATION_COMPLETED = 'timeSynchronizationComplete';
        this.UPDATE_TIME_SYNC_OFFSET = 'updateTimeSyncOffset';
        this.URL_RESOLUTION_FAILED = 'urlResolutionFailed';
        this.VIDEO_CHUNK_RECEIVED = 'videoChunkReceived';
        this.WALLCLOCK_TIME_UPDATED = 'wallclockTimeUpdated';
        this.XLINK_ELEMENT_LOADED = 'xlinkElementLoaded';
        this.XLINK_READY = 'xlinkReady';
        this.SEGMENTBASE_INIT_REQUEST_NEEDED = 'segmentBaseInitRequestNeeded';
        this.SEGMENTBASE_SEGMENTSLIST_REQUEST_NEEDED = 'segmentBaseSegmentsListRequestNeeded';
        this.SEEK_TARGET = 'seekTarget';
    }

    return CoreEvents;
})(_EventsBase3['default']);

exports['default'] = CoreEvents;
module.exports = exports['default'];

},{"18":18}],17:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _CoreEvents2 = _dereq_(16);

var _CoreEvents3 = _interopRequireDefault(_CoreEvents2);

var Events = (function (_CoreEvents) {
  _inherits(Events, _CoreEvents);

  function Events() {
    _classCallCheck(this, Events);

    _get(Object.getPrototypeOf(Events.prototype), 'constructor', this).apply(this, arguments);
  }

  return Events;
})(_CoreEvents3['default']);

var events = new Events();
exports['default'] = events;
module.exports = exports['default'];

},{"16":16}],18:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var EventsBase = (function () {
    function EventsBase() {
        _classCallCheck(this, EventsBase);
    }

    _createClass(EventsBase, [{
        key: 'extend',
        value: function extend(events, config) {
            if (!events) return;

            var override = config ? config.override : false;
            var publicOnly = config ? config.publicOnly : false;

            for (var evt in events) {
                if (!events.hasOwnProperty(evt) || this[evt] && !override) continue;
                if (publicOnly && events[evt].indexOf('public_') === -1) continue;
                this[evt] = events[evt];
            }
        }
    }]);

    return EventsBase;
})();

exports['default'] = EventsBase;
module.exports = exports['default'];

},{}],19:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _streamingVoFragmentRequest = _dereq_(82);

var _streamingVoFragmentRequest2 = _interopRequireDefault(_streamingVoFragmentRequest);

var _streamingVoMetricsHTTPRequest = _dereq_(87);

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _utilsSegmentsUtils = _dereq_(37);

var _controllersSegmentsController = _dereq_(22);

var _controllersSegmentsController2 = _interopRequireDefault(_controllersSegmentsController);

function DashHandler(config) {

    config = config || {};
    var context = this.context;

    var eventBus = config.eventBus;
    var events = config.events;
    var debug = config.debug;
    var dashConstants = config.dashConstants;
    var urlUtils = config.urlUtils;
    var type = config.type;
    var streamInfo = config.streamInfo;

    var timelineConverter = config.timelineConverter;
    var dashMetrics = config.dashMetrics;
    var baseURLController = config.baseURLController;

    var instance = undefined,
        logger = undefined,
        segmentIndex = undefined,
        lastSegment = undefined,
        requestedTime = undefined,
        isDynamicManifest = undefined,
        dynamicStreamCompleted = undefined,
        selectedMimeType = undefined,
        segmentsController = undefined;

    function setup() {
        logger = debug.getLogger(instance);
        resetInitialSettings();

        segmentsController = (0, _controllersSegmentsController2['default'])(context).create(config);

        eventBus.on(events.INITIALIZATION_LOADED, onInitializationLoaded, instance);
        eventBus.on(events.SEGMENTS_LOADED, onSegmentsLoaded, instance);
        eventBus.on(events.REPRESENTATION_UPDATE_STARTED, onRepresentationUpdateStarted, instance);
        eventBus.on(events.DYNAMIC_TO_STATIC, onDynamicToStatic, instance);
    }

    function initialize(isDynamic) {
        isDynamicManifest = isDynamic;
        dynamicStreamCompleted = false;
        segmentsController.initialize(isDynamic);
    }

    function getStreamId() {
        return streamInfo.id;
    }

    function getType() {
        return type;
    }

    function getStreamInfo() {
        return streamInfo;
    }

    function setCurrentIndex(value) {
        segmentIndex = value;
    }

    function getCurrentIndex() {
        return segmentIndex;
    }

    function resetIndex() {
        segmentIndex = -1;
        lastSegment = null;
    }

    function resetInitialSettings() {
        resetIndex();
        requestedTime = null;
        segmentsController = null;
        selectedMimeType = null;
    }

    function reset() {
        resetInitialSettings();

        eventBus.off(events.INITIALIZATION_LOADED, onInitializationLoaded, instance);
        eventBus.off(events.SEGMENTS_LOADED, onSegmentsLoaded, instance);
        eventBus.off(events.REPRESENTATION_UPDATE_STARTED, onRepresentationUpdateStarted, instance);
        eventBus.off(events.DYNAMIC_TO_STATIC, onDynamicToStatic, instance);
    }

    function setRequestUrl(request, destination, representation) {
        var baseURL = baseURLController.resolve(representation.path);
        var url = undefined,
            serviceLocation = undefined;

        if (!baseURL || destination === baseURL.url || !urlUtils.isRelative(destination)) {
            url = destination;
        } else {
            url = baseURL.url;
            serviceLocation = baseURL.serviceLocation;

            if (destination) {
                url = urlUtils.resolve(destination, url);
            }
        }

        if (urlUtils.isRelative(url)) {
            return false;
        }

        request.url = url;
        request.serviceLocation = serviceLocation;

        return true;
    }

    function generateInitRequest(mediaInfo, representation, mediaType) {
        var request = new _streamingVoFragmentRequest2['default']();
        var period = representation.adaptation.period;
        var presentationStartTime = period.start;

        request.mediaType = mediaType;
        request.type = _streamingVoMetricsHTTPRequest.HTTPRequest.INIT_SEGMENT_TYPE;
        request.range = representation.range;
        request.availabilityStartTime = timelineConverter.calcAvailabilityStartTimeFromPresentationTime(presentationStartTime, period.mpd, isDynamicManifest);
        request.availabilityEndTime = timelineConverter.calcAvailabilityEndTimeFromPresentationTime(presentationStartTime + period.duration, period.mpd, isDynamicManifest);
        request.quality = representation.index;
        request.mediaInfo = mediaInfo;
        request.representationId = representation.id;

        if (setRequestUrl(request, representation.initialization, representation)) {
            request.url = (0, _utilsSegmentsUtils.replaceTokenForTemplate)(request.url, 'Bandwidth', representation.bandwidth);
            return request;
        }
    }

    function getInitRequest(mediaInfo, representation) {
        if (!representation) return null;
        var request = generateInitRequest(mediaInfo, representation, getType());
        return request;
    }

    function setMimeType(newMimeType) {
        selectedMimeType = newMimeType;
    }

    function setExpectedLiveEdge(liveEdge) {
        timelineConverter.setExpectedLiveEdge(liveEdge);
        dashMetrics.updateManifestUpdateInfo({ presentationStartTime: liveEdge });
    }

    function onRepresentationUpdateStarted(e) {
        processRepresentation(e.representation);
    }

    function processRepresentation(voRepresentation) {
        var hasInitialization = voRepresentation.hasInitialization();
        var hasSegments = voRepresentation.hasSegments();

        // If representation has initialization and segments information, REPRESENTATION_UPDATE_COMPLETED can be triggered immediately
        // otherwise, it means that a request has to be made to get initialization and/or segments informations
        if (hasInitialization && hasSegments) {
            eventBus.trigger(events.REPRESENTATION_UPDATE_COMPLETED, { representation: voRepresentation }, { streamId: streamInfo.id, mediaType: type });
        } else {
            segmentsController.update(voRepresentation, selectedMimeType, hasInitialization, hasSegments);
        }
    }

    function getRequestForSegment(mediaInfo, segment) {
        if (segment === null || segment === undefined) {
            return null;
        }

        var request = new _streamingVoFragmentRequest2['default']();
        var representation = segment.representation;
        var bandwidth = representation.adaptation.period.mpd.manifest.Period_asArray[representation.adaptation.period.index].AdaptationSet_asArray[representation.adaptation.index].Representation_asArray[representation.index].bandwidth;
        var url = segment.media;

        url = (0, _utilsSegmentsUtils.replaceTokenForTemplate)(url, 'Number', segment.replacementNumber);
        url = (0, _utilsSegmentsUtils.replaceTokenForTemplate)(url, 'Time', segment.replacementTime);
        url = (0, _utilsSegmentsUtils.replaceTokenForTemplate)(url, 'Bandwidth', bandwidth);
        url = (0, _utilsSegmentsUtils.replaceIDForTemplate)(url, representation.id);
        url = (0, _utilsSegmentsUtils.unescapeDollarsInTemplate)(url);

        request.mediaType = getType();
        request.type = _streamingVoMetricsHTTPRequest.HTTPRequest.MEDIA_SEGMENT_TYPE;
        request.range = segment.mediaRange;
        request.startTime = segment.presentationStartTime;
        request.mediaStartTime = segment.mediaStartTime;
        request.duration = segment.duration;
        request.timescale = representation.timescale;
        request.availabilityStartTime = segment.availabilityStartTime;
        request.availabilityEndTime = segment.availabilityEndTime;
        request.wallStartTime = segment.wallStartTime;
        request.quality = representation.index;
        request.index = segment.availabilityIdx;
        request.mediaInfo = mediaInfo;
        request.adaptationIndex = representation.adaptation.index;
        request.representationId = representation.id;

        if (setRequestUrl(request, url, representation)) {
            return request;
        }
    }

    function isMediaFinished(representation) {
        var isFinished = false;

        if (!representation) return isFinished;

        if (!isDynamicManifest) {
            if (segmentIndex >= representation.availableSegmentsNumber) {
                isFinished = true;
            }
        } else {
            if (dynamicStreamCompleted) {
                isFinished = true;
            } else if (lastSegment) {
                var time = parseFloat((lastSegment.presentationStartTime - representation.adaptation.period.start).toFixed(5));
                var endTime = lastSegment.duration > 0 ? time + 1.5 * lastSegment.duration : time;
                var duration = representation.adaptation.period.duration;

                isFinished = endTime >= duration;
            }
        }
        return isFinished;
    }

    function getSegmentRequestForTime(mediaInfo, representation, time, options) {
        var request = null;

        if (!representation || !representation.segmentInfoType) {
            return request;
        }

        var idx = segmentIndex;
        var keepIdx = options ? options.keepIdx : false;
        var ignoreIsFinished = options && options.ignoreIsFinished ? true : false;

        if (requestedTime !== time) {
            // When playing at live edge with 0 delay we may loop back with same time and index until it is available. Reduces verboseness of logs.
            requestedTime = time;
            logger.debug('Getting the request for time : ' + time);
        }

        var segment = segmentsController.getSegmentByTime(representation, time);
        if (segment) {
            segmentIndex = segment.availabilityIdx;
            lastSegment = segment;
            logger.debug('Index for time ' + time + ' is ' + segmentIndex);
            request = getRequestForSegment(mediaInfo, segment);
        } else {
            var finished = !ignoreIsFinished ? isMediaFinished(representation) : false;
            if (finished) {
                request = new _streamingVoFragmentRequest2['default']();
                request.action = _streamingVoFragmentRequest2['default'].ACTION_COMPLETE;
                request.index = segmentIndex - 1;
                request.mediaType = type;
                request.mediaInfo = mediaInfo;
                logger.debug('Signal complete in getSegmentRequestForTime');
            }
        }

        if (keepIdx && idx >= 0) {
            segmentIndex = representation.segmentInfoType === dashConstants.SEGMENT_TIMELINE && isDynamicManifest ? segmentIndex : idx;
        }

        return request;
    }

    /**
     * This function returns the next segment request without modifying any internal variables. Any class (e.g CMCD Model) that needs information about the upcoming request should use this method.
     * @param {object} mediaInfo
     * @param {object} representation
     * @return {FragmentRequest|null}
     */
    function getNextSegmentRequestIdempotent(mediaInfo, representation) {
        var request = null;
        var indexToRequest = segmentIndex + 1;
        var segment = segmentsController.getSegmentByIndex(representation, indexToRequest, lastSegment ? lastSegment.mediaStartTime : -1);
        if (!segment) return null;
        request = getRequestForSegment(mediaInfo, segment);
        return request;
    }

    /**
     * Main function to get the next segment request.
     * @param {object} mediaInfo
     * @param {object} representation
     * @return {FragmentRequest|null}
     */
    function getNextSegmentRequest(mediaInfo, representation) {
        var request = null;

        if (!representation || !representation.segmentInfoType) {
            return null;
        }

        requestedTime = null;

        var indexToRequest = segmentIndex + 1;

        logger.debug('Getting the next request at index: ' + indexToRequest);
        // check that there is a segment in this index
        var segment = segmentsController.getSegmentByIndex(representation, indexToRequest, lastSegment ? lastSegment.mediaStartTime : -1);
        if (!segment && isEndlessMedia(representation) && !dynamicStreamCompleted) {
            logger.debug(getType() + ' No segment found at index: ' + indexToRequest + '. Wait for next loop');
            return null;
        } else {
            if (segment) {
                request = getRequestForSegment(mediaInfo, segment);
                segmentIndex = segment.availabilityIdx;
            } else {
                if (isDynamicManifest) {
                    segmentIndex = indexToRequest - 1;
                } else {
                    segmentIndex = indexToRequest;
                }
            }
        }

        if (segment) {
            lastSegment = segment;
        } else {
            var finished = isMediaFinished(representation, segment);
            if (finished) {
                request = new _streamingVoFragmentRequest2['default']();
                request.action = _streamingVoFragmentRequest2['default'].ACTION_COMPLETE;
                request.index = segmentIndex - 1;
                request.mediaType = getType();
                request.mediaInfo = mediaInfo;
                logger.debug('Signal complete');
            }
        }

        return request;
    }

    function isEndlessMedia(representation) {
        return !isFinite(representation.adaptation.period.duration);
    }

    function onInitializationLoaded(e) {
        var representation = e.representation;
        if (!representation.segments) return;

        eventBus.trigger(events.REPRESENTATION_UPDATE_COMPLETED, { representation: representation }, { streamId: streamInfo.id, mediaType: type });
    }

    function onSegmentsLoaded(e) {
        if (e.error) return;

        var fragments = e.segments;
        var representation = e.representation;
        var segments = [];
        var count = 0;

        var i = undefined,
            len = undefined,
            s = undefined,
            seg = undefined;

        for (i = 0, len = fragments ? fragments.length : 0; i < len; i++) {
            s = fragments[i];

            seg = (0, _utilsSegmentsUtils.getTimeBasedSegment)(timelineConverter, isDynamicManifest, representation, s.startTime, s.duration, s.timescale, s.media, s.mediaRange, count);

            if (seg) {
                segments.push(seg);
                seg = null;
                count++;
            }
        }

        if (segments.length > 0) {
            representation.segmentAvailabilityRange = {
                start: segments[0].presentationStartTime,
                end: segments[segments.length - 1].presentationStartTime
            };
            representation.availableSegmentsNumber = segments.length;
            representation.segments = segments;

            if (isDynamicManifest) {
                var _lastSegment = segments[segments.length - 1];
                var liveEdge = _lastSegment.presentationStartTime - 8;
                // the last segment is the Expected, not calculated, live edge.
                setExpectedLiveEdge(liveEdge);
            }
        }

        if (!representation.hasInitialization()) {
            return;
        }

        eventBus.trigger(events.REPRESENTATION_UPDATE_COMPLETED, { representation: representation }, { streamId: streamInfo.id, mediaType: type });
    }

    function onDynamicToStatic() {
        logger.debug('Dynamic stream complete');
        dynamicStreamCompleted = true;
    }

    instance = {
        initialize: initialize,
        getStreamId: getStreamId,
        getType: getType,
        getStreamInfo: getStreamInfo,
        getInitRequest: getInitRequest,
        getRequestForSegment: getRequestForSegment,
        getSegmentRequestForTime: getSegmentRequestForTime,
        getNextSegmentRequest: getNextSegmentRequest,
        setCurrentIndex: setCurrentIndex,
        getCurrentIndex: getCurrentIndex,
        isMediaFinished: isMediaFinished,
        reset: reset,
        resetIndex: resetIndex,
        setMimeType: setMimeType,
        getNextSegmentRequestIdempotent: getNextSegmentRequestIdempotent
    };

    setup();

    return instance;
}

DashHandler.__dashjs_factory_name = 'DashHandler';
exports['default'] = _coreFactoryMaker2['default'].getClassFactory(DashHandler);
module.exports = exports['default'];

},{"11":11,"22":22,"37":37,"82":82,"87":87}],20:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Dash constants declaration
 * @class
 * @ignore
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var DashConstants = (function () {
    _createClass(DashConstants, [{
        key: 'init',
        value: function init() {
            this.BASE_URL = 'BaseURL';
            this.SEGMENT_BASE = 'SegmentBase';
            this.SEGMENT_TEMPLATE = 'SegmentTemplate';
            this.SEGMENT_LIST = 'SegmentList';
            this.SEGMENT_URL = 'SegmentURL';
            this.SEGMENT_TIMELINE = 'SegmentTimeline';
            this.SEGMENT_PROFILES = 'segmentProfiles';
            this.ADAPTATION_SET = 'AdaptationSet';
            this.REPRESENTATION = 'Representation';
            this.REPRESENTATION_INDEX = 'RepresentationIndex';
            this.SUB_REPRESENTATION = 'SubRepresentation';
            this.INITIALIZATION = 'Initialization';
            this.INITIALIZATION_MINUS = 'initialization';
            this.MPD = 'MPD';
            this.PERIOD = 'Period';
            this.ASSET_IDENTIFIER = 'AssetIdentifier';
            this.EVENT_STREAM = 'EventStream';
            this.ID = 'id';
            this.PROFILES = 'profiles';
            this.SERVICE_LOCATION = 'serviceLocation';
            this.RANGE = 'range';
            this.INDEX = 'index';
            this.MEDIA = 'media';
            this.BYTE_RANGE = 'byteRange';
            this.INDEX_RANGE = 'indexRange';
            this.MEDIA_RANGE = 'mediaRange';
            this.VALUE = 'value';
            this.CONTENT_TYPE = 'contentType';
            this.MIME_TYPE = 'mimeType';
            this.BITSTREAM_SWITCHING = 'BitstreamSwitching';
            this.BITSTREAM_SWITCHING_MINUS = 'bitstreamSwitching';
            this.CODECS = 'codecs';
            this.DEPENDENCY_ID = 'dependencyId';
            this.MEDIA_STREAM_STRUCTURE_ID = 'mediaStreamStructureId';
            this.METRICS = 'Metrics';
            this.METRICS_MINUS = 'metrics';
            this.REPORTING = 'Reporting';
            this.WIDTH = 'width';
            this.HEIGHT = 'height';
            this.SAR = 'sar';
            this.FRAMERATE = 'frameRate';
            this.AUDIO_SAMPLING_RATE = 'audioSamplingRate';
            this.MAXIMUM_SAP_PERIOD = 'maximumSAPPeriod';
            this.START_WITH_SAP = 'startWithSAP';
            this.MAX_PLAYOUT_RATE = 'maxPlayoutRate';
            this.CODING_DEPENDENCY = 'codingDependency';
            this.SCAN_TYPE = 'scanType';
            this.FRAME_PACKING = 'FramePacking';
            this.AUDIO_CHANNEL_CONFIGURATION = 'AudioChannelConfiguration';
            this.CONTENT_PROTECTION = 'ContentProtection';
            this.ESSENTIAL_PROPERTY = 'EssentialProperty';
            this.SUPPLEMENTAL_PROPERTY = 'SupplementalProperty';
            this.INBAND_EVENT_STREAM = 'InbandEventStream';
            this.ACCESSIBILITY = 'Accessibility';
            this.ROLE = 'Role';
            this.RATING = 'Rating';
            this.CONTENT_COMPONENT = 'ContentComponent';
            this.SUBSET = 'Subset';
            this.LANG = 'lang';
            this.VIEWPOINT = 'Viewpoint';
            this.ROLE_ASARRAY = 'Role_asArray';
            this.ACCESSIBILITY_ASARRAY = 'Accessibility_asArray';
            this.AUDIOCHANNELCONFIGURATION_ASARRAY = 'AudioChannelConfiguration_asArray';
            this.CONTENTPROTECTION_ASARRAY = 'ContentProtection_asArray';
            this.MAIN = 'main';
            this.DYNAMIC = 'dynamic';
            this.STATIC = 'static';
            this.MEDIA_PRESENTATION_DURATION = 'mediaPresentationDuration';
            this.MINIMUM_UPDATE_PERIOD = 'minimumUpdatePeriod';
            this.CODEC_PRIVATE_DATA = 'codecPrivateData';
            this.BANDWITH = 'bandwidth';
            this.SOURCE_URL = 'sourceURL';
            this.TIMESCALE = 'timescale';
            this.DURATION = 'duration';
            this.START_NUMBER = 'startNumber';
            this.PRESENTATION_TIME_OFFSET = 'presentationTimeOffset';
            this.AVAILABILITY_START_TIME = 'availabilityStartTime';
            this.AVAILABILITY_END_TIME = 'availabilityEndTime';
            this.TIMESHIFT_BUFFER_DEPTH = 'timeShiftBufferDepth';
            this.MAX_SEGMENT_DURATION = 'maxSegmentDuration';
            this.PRESENTATION_TIME = 'presentationTime';
            this.MIN_BUFFER_TIME = 'minBufferTime';
            this.MAX_SUBSEGMENT_DURATION = 'maxSubsegmentDuration';
            this.START = 'start';
            this.AVAILABILITY_TIME_OFFSET = 'availabilityTimeOffset';
            this.AVAILABILITY_TIME_COMPLETE = 'availabilityTimeComplete';
            this.CENC_DEFAULT_KID = 'cenc:default_KID';
            this.DVB_PRIORITY = 'dvb:priority';
            this.DVB_WEIGHT = 'dvb:weight';
            this.SUGGESTED_PRESENTATION_DELAY = 'suggestedPresentationDelay';
            this.SERVICE_DESCRIPTION = 'ServiceDescription';
            this.SERVICE_DESCRIPTION_SCOPE = 'Scope';
            this.SERVICE_DESCRIPTION_LATENCY = 'Latency';
            this.SERVICE_DESCRIPTION_PLAYBACK_RATE = 'PlaybackRate';
            this.PATCH_LOCATION = 'PatchLocation';
            this.PUBLISH_TIME = 'publishTime';
            this.ORIGINAL_PUBLISH_TIME = 'originalPublishTime';
            this.ORIGINAL_MPD_ID = 'mpdId';
        }
    }]);

    function DashConstants() {
        _classCallCheck(this, DashConstants);

        this.init();
    }

    return DashConstants;
})();

var constants = new DashConstants();
exports['default'] = constants;
module.exports = exports['default'];

},{}],21:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _streamingConstantsConstants = _dereq_(65);

var _streamingConstantsConstants2 = _interopRequireDefault(_streamingConstantsConstants);

var _streamingVoDashJSError = _dereq_(81);

var _streamingVoDashJSError2 = _interopRequireDefault(_streamingVoDashJSError);

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

function RepresentationController(config) {

    config = config || {};
    var eventBus = config.eventBus;
    var events = config.events;
    var errors = config.errors;
    var abrController = config.abrController;
    var dashMetrics = config.dashMetrics;
    var playbackController = config.playbackController;
    var timelineConverter = config.timelineConverter;
    var type = config.type;
    var streamInfo = config.streamInfo;
    var dashConstants = config.dashConstants;

    var instance = undefined,
        realAdaptation = undefined,
        updating = undefined,
        voAvailableRepresentations = undefined,
        currentVoRepresentation = undefined;

    function setup() {
        resetInitialSettings();

        eventBus.on(events.QUALITY_CHANGE_REQUESTED, onQualityChanged, instance);
        eventBus.on(events.REPRESENTATION_UPDATE_COMPLETED, onRepresentationUpdated, instance);
        eventBus.on(events.WALLCLOCK_TIME_UPDATED, onWallclockTimeUpdated, instance);
        eventBus.on(events.MANIFEST_VALIDITY_CHANGED, onManifestValidityChanged, instance);
    }

    function getStreamId() {
        return streamInfo.id;
    }

    function getType() {
        return type;
    }

    function checkConfig() {
        if (!abrController || !dashMetrics || !playbackController || !timelineConverter) {
            throw new Error(_streamingConstantsConstants2['default'].MISSING_CONFIG_ERROR);
        }
    }

    function getData() {
        return realAdaptation;
    }

    function isUpdating() {
        return updating;
    }

    function getCurrentRepresentation() {
        return currentVoRepresentation;
    }

    function resetInitialSettings() {
        realAdaptation = null;
        updating = true;
        voAvailableRepresentations = [];
    }

    function reset() {
        eventBus.off(events.QUALITY_CHANGE_REQUESTED, onQualityChanged, instance);
        eventBus.off(events.REPRESENTATION_UPDATE_COMPLETED, onRepresentationUpdated, instance);
        eventBus.off(events.WALLCLOCK_TIME_UPDATED, onWallclockTimeUpdated, instance);
        eventBus.off(events.MANIFEST_VALIDITY_CHANGED, onManifestValidityChanged, instance);

        resetInitialSettings();
    }

    function updateData(newRealAdaptation, availableRepresentations, type, quality) {
        checkConfig();

        startDataUpdate();

        voAvailableRepresentations = availableRepresentations;

        currentVoRepresentation = getRepresentationForQuality(quality);
        realAdaptation = newRealAdaptation;

        if (type !== _streamingConstantsConstants2['default'].VIDEO && type !== _streamingConstantsConstants2['default'].AUDIO && type !== _streamingConstantsConstants2['default'].FRAGMENTED_TEXT) {
            endDataUpdate();
            return;
        }

        updateAvailabilityWindow(playbackController.getIsDynamic(), true);
    }

    function addRepresentationSwitch() {
        checkConfig();
        var now = new Date();
        var currentRepresentation = getCurrentRepresentation();
        var currentVideoTimeMs = playbackController.getTime() * 1000;
        if (currentRepresentation) {
            dashMetrics.addRepresentationSwitch(currentRepresentation.adaptation.type, now, currentVideoTimeMs, currentRepresentation.id);
        }
    }

    function getRepresentationForQuality(quality) {
        return quality === null || quality === undefined || quality >= voAvailableRepresentations.length ? null : voAvailableRepresentations[quality];
    }

    function getQualityForRepresentation(voRepresentation) {
        return voAvailableRepresentations.indexOf(voRepresentation);
    }

    function isAllRepresentationsUpdated() {
        for (var i = 0, ln = voAvailableRepresentations.length; i < ln; i++) {
            var segmentInfoType = voAvailableRepresentations[i].segmentInfoType;
            if (voAvailableRepresentations[i].segmentAvailabilityRange === null || !voAvailableRepresentations[i].hasInitialization() || (segmentInfoType === dashConstants.SEGMENT_BASE || segmentInfoType === dashConstants.BASE_URL) && !voAvailableRepresentations[i].segments) {
                return false;
            }
        }

        return true;
    }

    function setExpectedLiveEdge(liveEdge) {
        timelineConverter.setExpectedLiveEdge(liveEdge);
        dashMetrics.updateManifestUpdateInfo({ presentationStartTime: liveEdge });
    }

    function updateRepresentation(representation, isDynamic) {
        representation.segmentAvailabilityRange = timelineConverter.calcSegmentAvailabilityRange(representation, isDynamic);

        if (representation.segmentAvailabilityRange.end < representation.segmentAvailabilityRange.start) {
            var error = new _streamingVoDashJSError2['default'](errors.SEGMENTS_UNAVAILABLE_ERROR_CODE, errors.SEGMENTS_UNAVAILABLE_ERROR_MESSAGE, { availabilityDelay: representation.segmentAvailabilityRange.start - representation.segmentAvailabilityRange.end });
            endDataUpdate(error);
            return;
        }

        if (isDynamic) {
            setExpectedLiveEdge(representation.segmentAvailabilityRange.end);
        }
    }

    function updateAvailabilityWindow(isDynamic, notifyUpdate) {
        checkConfig();

        for (var i = 0, ln = voAvailableRepresentations.length; i < ln; i++) {
            updateRepresentation(voAvailableRepresentations[i], isDynamic);
            if (notifyUpdate) {
                eventBus.trigger(events.REPRESENTATION_UPDATE_STARTED, { representation: voAvailableRepresentations[i] }, { streamId: streamInfo.id, mediaType: type });
            }
        }
    }

    function resetAvailabilityWindow() {
        voAvailableRepresentations.forEach(function (rep) {
            rep.segmentAvailabilityRange = null;
        });
    }

    function startDataUpdate() {
        updating = true;
        eventBus.trigger(events.DATA_UPDATE_STARTED, {}, { streamId: streamInfo.id, mediaType: type });
    }

    function endDataUpdate(error) {
        updating = false;
        eventBus.trigger(events.DATA_UPDATE_COMPLETED, {
            data: realAdaptation,
            currentRepresentation: currentVoRepresentation,
            error: error
        }, { streamId: streamInfo.id, mediaType: type });
    }

    function postponeUpdate(postponeTimePeriod) {
        var delay = postponeTimePeriod;
        var update = function update() {
            if (isUpdating()) return;

            startDataUpdate();

            // clear the segmentAvailabilityRange for all reps.
            // this ensures all are updated before the live edge search starts
            resetAvailabilityWindow();

            updateAvailabilityWindow(playbackController.getIsDynamic(), true);
        };
        eventBus.trigger(events.AST_IN_FUTURE, { delay: delay });
        setTimeout(update, delay);
    }

    function onRepresentationUpdated(e) {
        if (!isUpdating()) return;

        if (e.error) {
            endDataUpdate(e.error);
            return;
        }

        var r = e.representation;
        var manifestUpdateInfo = dashMetrics.getCurrentManifestUpdate();
        var alreadyAdded = false;
        var postponeTimePeriod = 0;
        var repInfo = undefined,
            err = undefined,
            repSwitch = undefined;

        if (r.adaptation.period.mpd.manifest.type === dashConstants.DYNAMIC && !r.adaptation.period.mpd.manifest.ignorePostponeTimePeriod && playbackController.getStreamController().getStreams().length <= 1) {
            // We must put things to sleep unless till e.g. the startTime calculation in ScheduleController.onLiveEdgeSearchCompleted fall after the segmentAvailabilityRange.start
            postponeTimePeriod = getRepresentationUpdatePostponeTimePeriod(r);
        }

        if (postponeTimePeriod > 0) {
            postponeUpdate(postponeTimePeriod);
            err = new _streamingVoDashJSError2['default'](errors.SEGMENTS_UPDATE_FAILED_ERROR_CODE, errors.SEGMENTS_UPDATE_FAILED_ERROR_MESSAGE);
            endDataUpdate(err);
            return;
        }

        if (manifestUpdateInfo) {
            for (var i = 0; i < manifestUpdateInfo.representationInfo.length; i++) {
                repInfo = manifestUpdateInfo.representationInfo[i];
                if (repInfo.index === r.index && repInfo.mediaType === getType()) {
                    alreadyAdded = true;
                    break;
                }
            }

            if (!alreadyAdded) {
                dashMetrics.addManifestUpdateRepresentationInfo(r, getType());
            }
        }

        if (isAllRepresentationsUpdated()) {
            abrController.setPlaybackQuality(getType(), streamInfo, getQualityForRepresentation(currentVoRepresentation));
            dashMetrics.updateManifestUpdateInfo({ latency: currentVoRepresentation.segmentAvailabilityRange.end - playbackController.getTime() });

            repSwitch = dashMetrics.getCurrentRepresentationSwitch(getCurrentRepresentation().adaptation.type);

            if (!repSwitch) {
                addRepresentationSwitch();
            }
            endDataUpdate();
        }
    }

    function getRepresentationUpdatePostponeTimePeriod(representation) {
        try {
            var streamController = playbackController.getStreamController();
            var activeStreamInfo = streamController.getActiveStreamInfo();
            var startTimeAnchor = representation.segmentAvailabilityRange.start;

            if (activeStreamInfo && activeStreamInfo.id && activeStreamInfo.id !== streamInfo.id) {
                // We need to consider the currently playing period if a period switch is performed.
                startTimeAnchor = Math.min(playbackController.getTime(), startTimeAnchor);
            }

            var segmentAvailabilityTimePeriod = representation.segmentAvailabilityRange.end - startTimeAnchor;
            var liveDelay = playbackController.getLiveDelay();

            return (liveDelay - segmentAvailabilityTimePeriod) * 1000;
        } catch (e) {
            return 0;
        }
    }

    function onWallclockTimeUpdated(e) {
        if (e.isDynamic) {
            updateAvailabilityWindow(e.isDynamic);
        }
    }

    function onQualityChanged(e) {
        currentVoRepresentation = getRepresentationForQuality(e.newQuality);
        addRepresentationSwitch();
    }

    function onManifestValidityChanged(e) {
        if (e.newDuration) {
            var representation = getCurrentRepresentation();
            if (representation && representation.adaptation.period) {
                var period = representation.adaptation.period;
                period.duration = e.newDuration;
            }
        }
    }

    instance = {
        getStreamId: getStreamId,
        getType: getType,
        getData: getData,
        isUpdating: isUpdating,
        updateData: updateData,
        updateRepresentation: updateRepresentation,
        getCurrentRepresentation: getCurrentRepresentation,
        getRepresentationForQuality: getRepresentationForQuality,
        reset: reset
    };

    setup();
    return instance;
}

RepresentationController.__dashjs_factory_name = 'RepresentationController';
exports['default'] = _coreFactoryMaker2['default'].getClassFactory(RepresentationController);
module.exports = exports['default'];

},{"11":11,"65":65,"81":81}],22:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _utilsTimelineSegmentsGetter = _dereq_(39);

var _utilsTimelineSegmentsGetter2 = _interopRequireDefault(_utilsTimelineSegmentsGetter);

var _utilsTemplateSegmentsGetter = _dereq_(38);

var _utilsTemplateSegmentsGetter2 = _interopRequireDefault(_utilsTemplateSegmentsGetter);

var _utilsListSegmentsGetter = _dereq_(35);

var _utilsListSegmentsGetter2 = _interopRequireDefault(_utilsListSegmentsGetter);

var _utilsSegmentBaseGetter = _dereq_(36);

var _utilsSegmentBaseGetter2 = _interopRequireDefault(_utilsSegmentBaseGetter);

function SegmentsController(config) {
    config = config || {};

    var context = this.context;
    var events = config.events;
    var eventBus = config.eventBus;
    var dashConstants = config.dashConstants;
    var streamInfo = config.streamInfo;
    var type = config.type;

    var instance = undefined,
        getters = undefined;

    function setup() {
        getters = {};
    }

    function initialize(isDynamic) {
        getters[dashConstants.SEGMENT_TIMELINE] = (0, _utilsTimelineSegmentsGetter2['default'])(context).create(config, isDynamic);
        getters[dashConstants.SEGMENT_TEMPLATE] = (0, _utilsTemplateSegmentsGetter2['default'])(context).create(config, isDynamic);
        getters[dashConstants.SEGMENT_LIST] = (0, _utilsListSegmentsGetter2['default'])(context).create(config, isDynamic);
        getters[dashConstants.SEGMENT_BASE] = (0, _utilsSegmentBaseGetter2['default'])(context).create(config, isDynamic);
    }

    function update(voRepresentation, mimeType, hasInitialization, hasSegments) {
        if (!hasInitialization) {
            eventBus.trigger(events.SEGMENTBASE_INIT_REQUEST_NEEDED, {
                streamId: streamInfo.id,
                mediaType: type,
                mimeType: mimeType,
                representation: voRepresentation
            });
        }

        if (!hasSegments) {
            eventBus.trigger(events.SEGMENTBASE_SEGMENTSLIST_REQUEST_NEEDED, {
                streamId: streamInfo.id,
                mediaType: type,
                mimeType: mimeType,
                representation: voRepresentation
            });
        }
    }

    function getSegmentsGetter(representation) {
        return representation ? representation.segments ? getters[dashConstants.SEGMENT_BASE] : getters[representation.segmentInfoType] : null;
    }

    function getSegmentByIndex(representation, index, lastSegmentTime) {
        var getter = getSegmentsGetter(representation);
        return getter ? getter.getSegmentByIndex(representation, index, lastSegmentTime) : null;
    }

    function getSegmentByTime(representation, time) {
        var getter = getSegmentsGetter(representation);
        return getter ? getter.getSegmentByTime(representation, time) : null;
    }

    instance = {
        initialize: initialize,
        update: update,
        getSegmentByIndex: getSegmentByIndex,
        getSegmentByTime: getSegmentByTime
    };

    setup();

    return instance;
}

SegmentsController.__dashjs_factory_name = 'SegmentsController';
var factory = _coreFactoryMaker2['default'].getClassFactory(SegmentsController);
exports['default'] = factory;
module.exports = exports['default'];

},{"11":11,"35":35,"36":36,"38":38,"39":39}],23:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _streamingConstantsConstants = _dereq_(65);

var _streamingConstantsConstants2 = _interopRequireDefault(_streamingConstantsConstants);

var _constantsDashConstants = _dereq_(20);

var _constantsDashConstants2 = _interopRequireDefault(_constantsDashConstants);

var _voRepresentation = _dereq_(46);

var _voRepresentation2 = _interopRequireDefault(_voRepresentation);

var _voAdaptationSet = _dereq_(40);

var _voAdaptationSet2 = _interopRequireDefault(_voAdaptationSet);

var _voPeriod = _dereq_(45);

var _voPeriod2 = _interopRequireDefault(_voPeriod);

var _voMpd = _dereq_(44);

var _voMpd2 = _interopRequireDefault(_voMpd);

var _voUTCTiming = _dereq_(48);

var _voUTCTiming2 = _interopRequireDefault(_voUTCTiming);

var _voEvent = _dereq_(42);

var _voEvent2 = _interopRequireDefault(_voEvent);

var _voBaseURL = _dereq_(41);

var _voBaseURL2 = _interopRequireDefault(_voBaseURL);

var _voEventStream = _dereq_(43);

var _voEventStream2 = _interopRequireDefault(_voEventStream);

var _streamingUtilsObjectUtils = _dereq_(78);

var _streamingUtilsObjectUtils2 = _interopRequireDefault(_streamingUtilsObjectUtils);

var _streamingUtilsURLUtils = _dereq_(80);

var _streamingUtilsURLUtils2 = _interopRequireDefault(_streamingUtilsURLUtils);

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _coreDebug = _dereq_(9);

var _coreDebug2 = _interopRequireDefault(_coreDebug);

var _streamingVoDashJSError = _dereq_(81);

var _streamingVoDashJSError2 = _interopRequireDefault(_streamingVoDashJSError);

var _coreErrorsErrors = _dereq_(14);

var _coreErrorsErrors2 = _interopRequireDefault(_coreErrorsErrors);

var _streamingThumbnailThumbnailTracks = _dereq_(74);

function DashManifestModel() {
    var instance = undefined,
        logger = undefined,
        errHandler = undefined,
        BASE64 = undefined;

    var context = this.context;
    var urlUtils = (0, _streamingUtilsURLUtils2['default'])(context).getInstance();

    var isInteger = Number.isInteger || function (value) {
        return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
    };

    function setup() {
        logger = (0, _coreDebug2['default'])(context).getInstance().getLogger(instance);
    }

    function getIsTypeOf(adaptation, type) {

        var i = undefined,
            len = undefined,
            representation = undefined,
            col = undefined,
            mimeTypeRegEx = undefined,
            codecs = undefined;
        var result = false;
        var found = false;

        if (!adaptation) {
            throw new Error('adaptation is not defined');
        }

        if (!type) {
            throw new Error('type is not defined');
        }

        if (adaptation.hasOwnProperty('ContentComponent_asArray')) {
            col = adaptation.ContentComponent_asArray;
        }

        mimeTypeRegEx = type !== _streamingConstantsConstants2['default'].TEXT ? new RegExp(type) : new RegExp('(vtt|ttml)');

        if (adaptation.Representation_asArray && adaptation.Representation_asArray.length && adaptation.Representation_asArray.length > 0) {
            var essentialProperties = getEssentialPropertiesForRepresentation(adaptation.Representation_asArray[0]);
            if (essentialProperties && essentialProperties.length > 0 && _streamingThumbnailThumbnailTracks.THUMBNAILS_SCHEME_ID_URIS.indexOf(essentialProperties[0].schemeIdUri) >= 0) {
                return type === _streamingConstantsConstants2['default'].IMAGE;
            }
            if (adaptation.Representation_asArray[0].hasOwnProperty(_constantsDashConstants2['default'].CODECS)) {
                // Just check the start of the codecs string
                codecs = adaptation.Representation_asArray[0].codecs;
                if (codecs.search(_streamingConstantsConstants2['default'].STPP) === 0 || codecs.search(_streamingConstantsConstants2['default'].WVTT) === 0) {
                    return type === _streamingConstantsConstants2['default'].FRAGMENTED_TEXT;
                }
            }
        }

        if (col) {
            if (col.length > 1) {
                return type === _streamingConstantsConstants2['default'].MUXED;
            } else if (col[0] && col[0].contentType === type) {
                result = true;
                found = true;
            }
        }

        if (adaptation.hasOwnProperty(_constantsDashConstants2['default'].MIME_TYPE)) {
            result = mimeTypeRegEx.test(adaptation.mimeType);
            found = true;
        }

        // couldn't find on adaptationset, so check a representation
        if (!found) {
            i = 0;
            len = adaptation.Representation_asArray && adaptation.Representation_asArray.length ? adaptation.Representation_asArray.length : 0;
            while (!found && i < len) {
                representation = adaptation.Representation_asArray[i];

                if (representation.hasOwnProperty(_constantsDashConstants2['default'].MIME_TYPE)) {
                    result = mimeTypeRegEx.test(representation.mimeType);
                    found = true;
                }

                i++;
            }
        }

        return result;
    }

    function getIsAudio(adaptation) {
        return getIsTypeOf(adaptation, _streamingConstantsConstants2['default'].AUDIO);
    }

    function getIsVideo(adaptation) {
        return getIsTypeOf(adaptation, _streamingConstantsConstants2['default'].VIDEO);
    }

    function getIsFragmentedText(adaptation) {
        return getIsTypeOf(adaptation, _streamingConstantsConstants2['default'].FRAGMENTED_TEXT);
    }

    function getIsMuxed(adaptation) {
        return getIsTypeOf(adaptation, _streamingConstantsConstants2['default'].MUXED);
    }

    function getIsImage(adaptation) {
        return getIsTypeOf(adaptation, _streamingConstantsConstants2['default'].IMAGE);
    }

    function getIsTextTrack(type) {
        return type === 'text/vtt' || type === 'application/ttml+xml';
    }

    function getLanguageForAdaptation(adaptation) {
        var lang = '';

        if (adaptation && adaptation.hasOwnProperty(_constantsDashConstants2['default'].LANG)) {
            //Filter out any other characters not allowed according to RFC5646
            lang = adaptation.lang.replace(/[^A-Za-z0-9-]/g, '');
        }

        return lang;
    }

    function getViewpointForAdaptation(adaptation) {
        return adaptation && adaptation.hasOwnProperty(_constantsDashConstants2['default'].VIEWPOINT) ? adaptation.Viewpoint : null;
    }

    function getRolesForAdaptation(adaptation) {
        return adaptation && adaptation.hasOwnProperty(_constantsDashConstants2['default'].ROLE_ASARRAY) ? adaptation.Role_asArray : [];
    }

    function getAccessibilityForAdaptation(adaptation) {
        return adaptation && adaptation.hasOwnProperty(_constantsDashConstants2['default'].ACCESSIBILITY_ASARRAY) ? adaptation.Accessibility_asArray : [];
    }

    function getAudioChannelConfigurationForAdaptation(adaptation) {
        return adaptation && adaptation.hasOwnProperty(_constantsDashConstants2['default'].AUDIOCHANNELCONFIGURATION_ASARRAY) ? adaptation.AudioChannelConfiguration_asArray : [];
    }

    function getAudioChannelConfigurationForRepresentation(representation) {
        return representation && representation.hasOwnProperty(_constantsDashConstants2['default'].AUDIOCHANNELCONFIGURATION_ASARRAY) ? representation.AudioChannelConfiguration_asArray : [];
    }

    function getRepresentationSortFunction() {
        return function (a, b) {
            return a.bandwidth - b.bandwidth;
        };
    }

    function processAdaptation(realAdaptation) {
        if (realAdaptation && Array.isArray(realAdaptation.Representation_asArray)) {
            realAdaptation.Representation_asArray.sort(getRepresentationSortFunction());
        }

        return realAdaptation;
    }

    function getRealAdaptations(manifest, periodIndex) {
        return manifest && manifest.Period_asArray && isInteger(periodIndex) ? manifest.Period_asArray[periodIndex] ? manifest.Period_asArray[periodIndex].AdaptationSet_asArray : [] : [];
    }

    function getRealPeriods(manifest) {
        return manifest && manifest.Period_asArray ? manifest.Period_asArray : [];
    }

    function getRealPeriodForIndex(index, manifest) {
        var realPeriods = getRealPeriods(manifest);
        if (realPeriods.length > 0 && isInteger(index)) {
            return realPeriods[index];
        } else {
            return null;
        }
    }

    function getAdaptationForId(id, manifest, periodIndex) {
        var realAdaptations = getRealAdaptations(manifest, periodIndex);
        var i = undefined,
            len = undefined;

        for (i = 0, len = realAdaptations.length; i < len; i++) {
            if (realAdaptations[i].hasOwnProperty(_constantsDashConstants2['default'].ID) && realAdaptations[i].id === id) {
                return realAdaptations[i];
            }
        }

        return null;
    }

    function getAdaptationForIndex(index, manifest, periodIndex) {
        var realAdaptations = getRealAdaptations(manifest, periodIndex);
        if (realAdaptations.length > 0 && isInteger(index)) {
            return realAdaptations[index];
        } else {
            return null;
        }
    }

    function getIndexForAdaptation(realAdaptation, manifest, periodIndex) {
        if (!realAdaptation) {
            return -1;
        }

        var realAdaptations = getRealAdaptations(manifest, periodIndex);

        for (var i = 0; i < realAdaptations.length; i++) {
            var objectUtils = (0, _streamingUtilsObjectUtils2['default'])(context).getInstance();
            if (objectUtils.areEqual(realAdaptations[i], realAdaptation)) {
                return i;
            }
        }

        return -1;
    }

    function getAdaptationsForType(manifest, periodIndex, type) {
        var realAdaptations = getRealAdaptations(manifest, periodIndex);
        var i = undefined,
            len = undefined;
        var adaptations = [];

        for (i = 0, len = realAdaptations.length; i < len; i++) {
            if (getIsTypeOf(realAdaptations[i], type)) {
                adaptations.push(processAdaptation(realAdaptations[i]));
            }
        }

        return adaptations;
    }

    function getCodec(adaptation, representationId, addResolutionInfo) {
        var codec = null;

        if (adaptation && adaptation.Representation_asArray && adaptation.Representation_asArray.length > 0) {
            var representation = isInteger(representationId) && representationId >= 0 && representationId < adaptation.Representation_asArray.length ? adaptation.Representation_asArray[representationId] : adaptation.Representation_asArray[0];
            if (representation) {
                codec = representation.mimeType + ';codecs="' + representation.codecs + '"';
                if (addResolutionInfo && representation.width !== undefined) {
                    codec += ';width="' + representation.width + '";height="' + representation.height + '"';
                }
            }
        }

        // If the codec contains a profiles parameter we remove it. Otherwise it will cause problems when checking for codec capabilities of the platform
        if (codec) {
            codec = codec.replace(/\sprofiles=[^;]*/g, '');
        }

        return codec;
    }

    function getMimeType(adaptation) {
        return adaptation && adaptation.Representation_asArray && adaptation.Representation_asArray.length > 0 ? adaptation.Representation_asArray[0].mimeType : null;
    }

    function getKID(adaptation) {
        if (!adaptation || !adaptation.hasOwnProperty(_constantsDashConstants2['default'].CENC_DEFAULT_KID)) {
            return null;
        }
        return adaptation[_constantsDashConstants2['default'].CENC_DEFAULT_KID];
    }

    function getLabelsForAdaptation(adaptation) {
        if (!adaptation || !Array.isArray(adaptation.Label_asArray)) {
            return [];
        }

        var labelArray = [];

        for (var i = 0; i < adaptation.Label_asArray.length; i++) {
            labelArray.push({
                lang: adaptation.Label_asArray[i].lang,
                text: adaptation.Label_asArray[i].__text || adaptation.Label_asArray[i]
            });
        }

        return labelArray;
    }

    function getContentProtectionData(adaptation) {
        if (!adaptation || !adaptation.hasOwnProperty(_constantsDashConstants2['default'].CONTENTPROTECTION_ASARRAY) || adaptation.ContentProtection_asArray.length === 0) {
            return null;
        }
        return adaptation.ContentProtection_asArray;
    }

    function getIsDynamic(manifest) {
        var isDynamic = false;
        if (manifest && manifest.hasOwnProperty('type')) {
            isDynamic = manifest.type === _constantsDashConstants2['default'].DYNAMIC;
        }
        return isDynamic;
    }

    function getId(manifest) {
        return manifest && manifest[_constantsDashConstants2['default'].ID] || null;
    }

    function hasProfile(manifest, profile) {
        var has = false;

        if (manifest && manifest.profiles && manifest.profiles.length > 0) {
            has = manifest.profiles.indexOf(profile) !== -1;
        }

        return has;
    }

    function getDuration(manifest) {
        var mpdDuration = undefined;
        //@mediaPresentationDuration specifies the duration of the entire Media Presentation.
        //If the attribute is not present, the duration of the Media Presentation is unknown.
        if (manifest && manifest.hasOwnProperty(_constantsDashConstants2['default'].MEDIA_PRESENTATION_DURATION)) {
            mpdDuration = manifest.mediaPresentationDuration;
        } else if (manifest && manifest.type == 'dynamic') {
            mpdDuration = Number.POSITIVE_INFINITY;
        } else {
            mpdDuration = Number.MAX_SAFE_INTEGER || Number.MAX_VALUE;
        }

        return mpdDuration;
    }

    function getBandwidth(representation) {
        return representation && representation.bandwidth ? representation.bandwidth : NaN;
    }

    function getManifestUpdatePeriod(manifest) {
        var latencyOfLastUpdate = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

        var delay = NaN;
        if (manifest && manifest.hasOwnProperty(_constantsDashConstants2['default'].MINIMUM_UPDATE_PERIOD)) {
            delay = manifest.minimumUpdatePeriod;
        }
        return isNaN(delay) ? delay : Math.max(delay - latencyOfLastUpdate, 1);
    }

    function getPublishTime(manifest) {
        return manifest && manifest.hasOwnProperty(_constantsDashConstants2['default'].PUBLISH_TIME) ? new Date(manifest[_constantsDashConstants2['default'].PUBLISH_TIME]) : null;
    }

    function getRepresentationCount(adaptation) {
        return adaptation && Array.isArray(adaptation.Representation_asArray) ? adaptation.Representation_asArray.length : 0;
    }

    function getBitrateListForAdaptation(realAdaptation) {
        var processedRealAdaptation = processAdaptation(realAdaptation);
        var realRepresentations = processedRealAdaptation && Array.isArray(processedRealAdaptation.Representation_asArray) ? processedRealAdaptation.Representation_asArray : [];

        return realRepresentations.map(function (realRepresentation) {
            return {
                bandwidth: realRepresentation.bandwidth,
                width: realRepresentation.width || 0,
                height: realRepresentation.height || 0,
                scanType: realRepresentation.scanType || null,
                id: realRepresentation.id || null
            };
        });
    }

    function getEssentialPropertiesForRepresentation(realRepresentation) {
        if (!realRepresentation || !realRepresentation.EssentialProperty_asArray || !realRepresentation.EssentialProperty_asArray.length) return null;

        return realRepresentation.EssentialProperty_asArray.map(function (prop) {
            return {
                schemeIdUri: prop.schemeIdUri,
                value: prop.value
            };
        });
    }

    function getRepresentationFor(index, adaptation) {
        return adaptation && adaptation.Representation_asArray && adaptation.Representation_asArray.length > 0 && isInteger(index) ? adaptation.Representation_asArray[index] : null;
    }

    function getRealAdaptationFor(voAdaptation) {
        if (voAdaptation && voAdaptation.period && isInteger(voAdaptation.period.index)) {
            var periodArray = voAdaptation.period.mpd.manifest.Period_asArray[voAdaptation.period.index];
            if (periodArray && periodArray.AdaptationSet_asArray && isInteger(voAdaptation.index)) {
                return processAdaptation(periodArray.AdaptationSet_asArray[voAdaptation.index]);
            }
        }
    }

    function getRepresentationsForAdaptation(voAdaptation) {
        var voRepresentations = [];
        var processedRealAdaptation = getRealAdaptationFor(voAdaptation);
        var segmentInfo = undefined,
            baseUrl = undefined;

        if (processedRealAdaptation && processedRealAdaptation.Representation_asArray) {
            // TODO: TO BE REMOVED. We should get just the baseUrl elements that affects to the representations
            // that we are processing. Making it works properly will require much further changes and given
            // parsing base Urls parameters is needed for our ultra low latency examples, we will
            // keep this "tricky" code until the real (and good) solution comes
            if (voAdaptation && voAdaptation.period && isInteger(voAdaptation.period.index)) {
                var baseUrls = getBaseURLsFromElement(voAdaptation.period.mpd.manifest);
                if (baseUrls) {
                    baseUrl = baseUrls[0];
                }
            }
            for (var i = 0, len = processedRealAdaptation.Representation_asArray.length; i < len; ++i) {
                var realRepresentation = processedRealAdaptation.Representation_asArray[i];
                var voRepresentation = new _voRepresentation2['default']();
                voRepresentation.index = i;
                voRepresentation.adaptation = voAdaptation;

                if (realRepresentation.hasOwnProperty(_constantsDashConstants2['default'].ID)) {
                    voRepresentation.id = realRepresentation.id;
                }
                if (realRepresentation.hasOwnProperty(_constantsDashConstants2['default'].CODECS)) {
                    voRepresentation.codecs = realRepresentation.codecs;
                }
                if (realRepresentation.hasOwnProperty(_constantsDashConstants2['default'].CODEC_PRIVATE_DATA)) {
                    voRepresentation.codecPrivateData = realRepresentation.codecPrivateData;
                }
                if (realRepresentation.hasOwnProperty(_constantsDashConstants2['default'].BANDWITH)) {
                    voRepresentation.bandwidth = realRepresentation.bandwidth;
                }
                if (realRepresentation.hasOwnProperty(_constantsDashConstants2['default'].WIDTH)) {
                    voRepresentation.width = realRepresentation.width;
                }
                if (realRepresentation.hasOwnProperty(_constantsDashConstants2['default'].HEIGHT)) {
                    voRepresentation.height = realRepresentation.height;
                }
                if (realRepresentation.hasOwnProperty(_constantsDashConstants2['default'].SCAN_TYPE)) {
                    voRepresentation.scanType = realRepresentation.scanType;
                }
                if (realRepresentation.hasOwnProperty(_constantsDashConstants2['default'].MAX_PLAYOUT_RATE)) {
                    voRepresentation.maxPlayoutRate = realRepresentation.maxPlayoutRate;
                }

                if (realRepresentation.hasOwnProperty(_constantsDashConstants2['default'].SEGMENT_BASE)) {
                    segmentInfo = realRepresentation.SegmentBase;
                    voRepresentation.segmentInfoType = _constantsDashConstants2['default'].SEGMENT_BASE;
                } else if (realRepresentation.hasOwnProperty(_constantsDashConstants2['default'].SEGMENT_LIST)) {
                    segmentInfo = realRepresentation.SegmentList;

                    if (segmentInfo.hasOwnProperty(_constantsDashConstants2['default'].SEGMENT_TIMELINE)) {
                        voRepresentation.segmentInfoType = _constantsDashConstants2['default'].SEGMENT_TIMELINE;
                    } else {
                        voRepresentation.segmentInfoType = _constantsDashConstants2['default'].SEGMENT_LIST;
                    }
                } else if (realRepresentation.hasOwnProperty(_constantsDashConstants2['default'].SEGMENT_TEMPLATE)) {
                    segmentInfo = realRepresentation.SegmentTemplate;

                    if (segmentInfo.hasOwnProperty(_constantsDashConstants2['default'].SEGMENT_TIMELINE)) {
                        voRepresentation.segmentInfoType = _constantsDashConstants2['default'].SEGMENT_TIMELINE;
                    } else {
                        voRepresentation.segmentInfoType = _constantsDashConstants2['default'].SEGMENT_TEMPLATE;
                    }

                    if (segmentInfo.hasOwnProperty(_constantsDashConstants2['default'].INITIALIZATION_MINUS)) {
                        voRepresentation.initialization = segmentInfo.initialization.split('$Bandwidth$').join(realRepresentation.bandwidth).split('$RepresentationID$').join(realRepresentation.id);
                    }
                } else {
                    voRepresentation.segmentInfoType = _constantsDashConstants2['default'].BASE_URL;
                }

                voRepresentation.essentialProperties = getEssentialPropertiesForRepresentation(realRepresentation);

                if (segmentInfo) {
                    if (segmentInfo.hasOwnProperty(_constantsDashConstants2['default'].INITIALIZATION)) {
                        var initialization = segmentInfo.Initialization;

                        if (initialization.hasOwnProperty(_constantsDashConstants2['default'].SOURCE_URL)) {
                            voRepresentation.initialization = initialization.sourceURL;
                        }

                        if (initialization.hasOwnProperty(_constantsDashConstants2['default'].RANGE)) {
                            voRepresentation.range = initialization.range;
                            // initialization source url will be determined from
                            // BaseURL when resolved at load time.
                        }
                    } else if (realRepresentation.hasOwnProperty(_constantsDashConstants2['default'].MIME_TYPE) && getIsTextTrack(realRepresentation.mimeType)) {
                            voRepresentation.range = 0;
                        }

                    if (segmentInfo.hasOwnProperty(_constantsDashConstants2['default'].TIMESCALE)) {
                        voRepresentation.timescale = segmentInfo.timescale;
                    }
                    if (segmentInfo.hasOwnProperty(_constantsDashConstants2['default'].DURATION)) {
                        // TODO according to the spec @maxSegmentDuration specifies the maximum duration of any Segment in any Representation in the Media Presentation
                        // It is also said that for a SegmentTimeline any @d value shall not exceed the value of MPD@maxSegmentDuration, but nothing is said about
                        // SegmentTemplate @duration attribute. We need to find out if @maxSegmentDuration should be used instead of calculated duration if the the duration
                        // exceeds @maxSegmentDuration
                        voRepresentation.segmentDuration = segmentInfo.duration / voRepresentation.timescale;
                    } else if (realRepresentation.hasOwnProperty(_constantsDashConstants2['default'].SEGMENT_TEMPLATE)) {
                        segmentInfo = realRepresentation.SegmentTemplate;

                        if (segmentInfo.hasOwnProperty(_constantsDashConstants2['default'].SEGMENT_TIMELINE)) {
                            voRepresentation.segmentDuration = calcSegmentDuration(segmentInfo.SegmentTimeline) / voRepresentation.timescale;
                        }
                    }
                    if (segmentInfo.hasOwnProperty(_constantsDashConstants2['default'].MEDIA)) {
                        voRepresentation.media = segmentInfo.media;
                    }
                    if (segmentInfo.hasOwnProperty(_constantsDashConstants2['default'].START_NUMBER)) {
                        voRepresentation.startNumber = segmentInfo.startNumber;
                    }
                    if (segmentInfo.hasOwnProperty(_constantsDashConstants2['default'].INDEX_RANGE)) {
                        voRepresentation.indexRange = segmentInfo.indexRange;
                    }
                    if (segmentInfo.hasOwnProperty(_constantsDashConstants2['default'].PRESENTATION_TIME_OFFSET)) {
                        voRepresentation.presentationTimeOffset = segmentInfo.presentationTimeOffset / voRepresentation.timescale;
                    }
                    if (segmentInfo.hasOwnProperty(_constantsDashConstants2['default'].AVAILABILITY_TIME_OFFSET)) {
                        voRepresentation.availabilityTimeOffset = segmentInfo.availabilityTimeOffset;
                    } else if (baseUrl && baseUrl.availabilityTimeOffset !== undefined) {
                        voRepresentation.availabilityTimeOffset = baseUrl.availabilityTimeOffset;
                    }
                    if (segmentInfo.hasOwnProperty(_constantsDashConstants2['default'].AVAILABILITY_TIME_COMPLETE)) {
                        voRepresentation.availabilityTimeComplete = segmentInfo.availabilityTimeComplete !== 'false';
                    } else if (baseUrl && baseUrl.availabilityTimeComplete !== undefined) {
                        voRepresentation.availabilityTimeComplete = baseUrl.availabilityTimeComplete;
                    }
                }

                voRepresentation.MSETimeOffset = calcMSETimeOffset(voRepresentation);
                voRepresentation.path = [voAdaptation.period.index, voAdaptation.index, i];
                voRepresentations.push(voRepresentation);
            }
        }

        return voRepresentations;
    }

    function calcSegmentDuration(segmentTimeline) {
        var s0 = segmentTimeline.S_asArray[0];
        var s1 = segmentTimeline.S_asArray[1];
        return s0.hasOwnProperty('d') ? s0.d : s1.t - s0.t;
    }

    function calcMSETimeOffset(representation) {
        // The MSEOffset is offset from AST for media. It is Period@start - presentationTimeOffset
        var presentationOffset = representation.presentationTimeOffset;
        var periodStart = representation.adaptation.period.start;
        return periodStart - presentationOffset;
    }

    function getAdaptationsForPeriod(voPeriod) {
        var realPeriod = voPeriod && isInteger(voPeriod.index) ? voPeriod.mpd.manifest.Period_asArray[voPeriod.index] : null;
        var voAdaptations = [];
        var voAdaptationSet = undefined,
            realAdaptationSet = undefined,
            i = undefined;

        if (realPeriod && realPeriod.AdaptationSet_asArray) {
            for (i = 0; i < realPeriod.AdaptationSet_asArray.length; i++) {
                realAdaptationSet = realPeriod.AdaptationSet_asArray[i];
                voAdaptationSet = new _voAdaptationSet2['default']();
                if (realAdaptationSet.hasOwnProperty(_constantsDashConstants2['default'].ID)) {
                    voAdaptationSet.id = realAdaptationSet.id;
                }
                voAdaptationSet.index = i;
                voAdaptationSet.period = voPeriod;

                if (getIsMuxed(realAdaptationSet)) {
                    voAdaptationSet.type = _streamingConstantsConstants2['default'].MUXED;
                } else if (getIsAudio(realAdaptationSet)) {
                    voAdaptationSet.type = _streamingConstantsConstants2['default'].AUDIO;
                } else if (getIsVideo(realAdaptationSet)) {
                    voAdaptationSet.type = _streamingConstantsConstants2['default'].VIDEO;
                } else if (getIsFragmentedText(realAdaptationSet)) {
                    voAdaptationSet.type = _streamingConstantsConstants2['default'].FRAGMENTED_TEXT;
                } else if (getIsImage(realAdaptationSet)) {
                    voAdaptationSet.type = _streamingConstantsConstants2['default'].IMAGE;
                } else {
                    voAdaptationSet.type = _streamingConstantsConstants2['default'].TEXT;
                }
                voAdaptations.push(voAdaptationSet);
            }
        }

        return voAdaptations;
    }

    function getRegularPeriods(mpd) {
        var isDynamic = mpd ? getIsDynamic(mpd.manifest) : false;
        var voPeriods = [];
        var realPreviousPeriod = null;
        var realPeriod = null;
        var voPreviousPeriod = null;
        var voPeriod = null;
        var len = undefined,
            i = undefined;

        for (i = 0, len = mpd && mpd.manifest && mpd.manifest.Period_asArray ? mpd.manifest.Period_asArray.length : 0; i < len; i++) {
            realPeriod = mpd.manifest.Period_asArray[i];

            // If the attribute @start is present in the Period, then the
            // Period is a regular Period and the PeriodStart is equal
            // to the value of this attribute.
            if (realPeriod.hasOwnProperty(_constantsDashConstants2['default'].START)) {
                voPeriod = new _voPeriod2['default']();
                voPeriod.start = realPeriod.start;
            }
            // If the @start attribute is absent, but the previous Period
            // element contains a @duration attribute then then this new
            // Period is also a regular Period. The start time of the new
            // Period PeriodStart is the sum of the start time of the previous
            // Period PeriodStart and the value of the attribute @duration
            // of the previous Period.
            else if (realPreviousPeriod !== null && realPreviousPeriod.hasOwnProperty(_constantsDashConstants2['default'].DURATION) && voPreviousPeriod !== null) {
                    voPeriod = new _voPeriod2['default']();
                    voPeriod.start = parseFloat((voPreviousPeriod.start + voPreviousPeriod.duration).toFixed(5));
                }
                // If (i) @start attribute is absent, and (ii) the Period element
                // is the first in the MPD, and (iii) the MPD@type is 'static',
                // then the PeriodStart time shall be set to zero.
                else if (i === 0 && !isDynamic) {
                        voPeriod = new _voPeriod2['default']();
                        voPeriod.start = 0;
                    }

            // The Period extends until the PeriodStart of the next Period.
            // The difference between the PeriodStart time of a Period and
            // the PeriodStart time of the following Period.
            if (voPreviousPeriod !== null && isNaN(voPreviousPeriod.duration)) {
                if (voPeriod !== null) {
                    voPreviousPeriod.duration = parseFloat((voPeriod.start - voPreviousPeriod.start).toFixed(5));
                } else {
                    logger.warn('First period duration could not be calculated because lack of start and duration period properties. This will cause timing issues during playback');
                }
            }

            if (voPeriod !== null) {
                voPeriod.id = getPeriodId(realPeriod, i);
                voPeriod.index = i;
                voPeriod.mpd = mpd;

                if (realPeriod.hasOwnProperty(_constantsDashConstants2['default'].DURATION)) {
                    voPeriod.duration = realPeriod.duration;
                }

                voPeriods.push(voPeriod);
                realPreviousPeriod = realPeriod;
                voPreviousPeriod = voPeriod;
            }

            realPeriod = null;
            voPeriod = null;
        }

        if (voPeriods.length === 0) {
            return voPeriods;
        }

        // The last Period extends until the end of the Media Presentation.
        // The difference between the PeriodStart time of the last Period
        // and the mpd duration
        if (voPreviousPeriod !== null && isNaN(voPreviousPeriod.duration)) {
            voPreviousPeriod.duration = parseFloat((getEndTimeForLastPeriod(voPreviousPeriod) - voPreviousPeriod.start).toFixed(5));
        }

        return voPeriods;
    }

    function getPeriodId(realPeriod, i) {
        if (!realPeriod) {
            throw new Error('Period cannot be null or undefined');
        }

        var id = _voPeriod2['default'].DEFAULT_ID + '_' + i;

        if (realPeriod.hasOwnProperty(_constantsDashConstants2['default'].ID) && realPeriod.id.length > 0 && realPeriod.id !== '__proto__') {
            id = realPeriod.id;
        }

        return id;
    }

    function getMpd(manifest) {
        var mpd = new _voMpd2['default']();

        if (manifest) {
            mpd.manifest = manifest;

            if (manifest.hasOwnProperty(_constantsDashConstants2['default'].AVAILABILITY_START_TIME)) {
                mpd.availabilityStartTime = new Date(manifest.availabilityStartTime.getTime());
            } else {
                if (manifest.loadedTime) {
                    mpd.availabilityStartTime = new Date(manifest.loadedTime.getTime());
                }
            }

            if (manifest.hasOwnProperty(_constantsDashConstants2['default'].AVAILABILITY_END_TIME)) {
                mpd.availabilityEndTime = new Date(manifest.availabilityEndTime.getTime());
            }

            if (manifest.hasOwnProperty(_constantsDashConstants2['default'].MINIMUM_UPDATE_PERIOD)) {
                mpd.minimumUpdatePeriod = manifest.minimumUpdatePeriod;
            }

            if (manifest.hasOwnProperty(_constantsDashConstants2['default'].MEDIA_PRESENTATION_DURATION)) {
                mpd.mediaPresentationDuration = manifest.mediaPresentationDuration;
            }

            if (manifest.hasOwnProperty(_constantsDashConstants2['default'].SUGGESTED_PRESENTATION_DELAY)) {
                mpd.suggestedPresentationDelay = manifest.suggestedPresentationDelay;
            }

            if (manifest.hasOwnProperty(_constantsDashConstants2['default'].TIMESHIFT_BUFFER_DEPTH)) {
                mpd.timeShiftBufferDepth = manifest.timeShiftBufferDepth;
            }

            if (manifest.hasOwnProperty(_constantsDashConstants2['default'].MAX_SEGMENT_DURATION)) {
                mpd.maxSegmentDuration = manifest.maxSegmentDuration;
            }

            if (manifest.hasOwnProperty(_constantsDashConstants2['default'].PUBLISH_TIME)) {
                mpd.publishTime = new Date(manifest.publishTime);
            }
        }

        return mpd;
    }

    function checkConfig() {
        if (!errHandler || !errHandler.hasOwnProperty('error')) {
            throw new Error(_streamingConstantsConstants2['default'].MISSING_CONFIG_ERROR);
        }
    }

    function getEndTimeForLastPeriod(voPeriod) {
        checkConfig();
        var isDynamic = getIsDynamic(voPeriod.mpd.manifest);

        var periodEnd = undefined;
        if (voPeriod.mpd.manifest.mediaPresentationDuration) {
            periodEnd = voPeriod.mpd.manifest.mediaPresentationDuration;
        } else if (voPeriod.duration) {
            periodEnd = voPeriod.duration;
        } else if (isDynamic) {
            periodEnd = Number.POSITIVE_INFINITY;
        } else {
            errHandler.error(new _streamingVoDashJSError2['default'](_coreErrorsErrors2['default'].MANIFEST_ERROR_ID_PARSE_CODE, 'Must have @mediaPresentationDuration on MPD or an explicit @duration on the last period.', voPeriod));
        }

        return periodEnd;
    }

    function getEventsForPeriod(period) {
        var manifest = period && period.mpd && period.mpd.manifest ? period.mpd.manifest : null;
        var periodArray = manifest ? manifest.Period_asArray : null;
        var eventStreams = periodArray && period && isInteger(period.index) ? periodArray[period.index].EventStream_asArray : null;
        var events = [];
        var i = undefined,
            j = undefined;

        if (eventStreams) {
            for (i = 0; i < eventStreams.length; i++) {
                var eventStream = new _voEventStream2['default']();
                eventStream.period = period;
                eventStream.timescale = 1;

                if (eventStreams[i].hasOwnProperty(_streamingConstantsConstants2['default'].SCHEME_ID_URI)) {
                    eventStream.schemeIdUri = eventStreams[i][_streamingConstantsConstants2['default'].SCHEME_ID_URI];
                } else {
                    throw new Error('Invalid EventStream. SchemeIdUri has to be set');
                }
                if (eventStreams[i].hasOwnProperty(_constantsDashConstants2['default'].TIMESCALE)) {
                    eventStream.timescale = eventStreams[i][_constantsDashConstants2['default'].TIMESCALE];
                }
                if (eventStreams[i].hasOwnProperty(_constantsDashConstants2['default'].VALUE)) {
                    eventStream.value = eventStreams[i][_constantsDashConstants2['default'].VALUE];
                }
                if (eventStreams[i].hasOwnProperty(_constantsDashConstants2['default'].PRESENTATION_TIME_OFFSET)) {
                    eventStream.presentationTimeOffset = eventStreams[i][_constantsDashConstants2['default'].PRESENTATION_TIME_OFFSET];
                }
                for (j = 0; eventStreams[i].Event_asArray && j < eventStreams[i].Event_asArray.length; j++) {
                    var currentMpdEvent = eventStreams[i].Event_asArray[j];
                    var _event = new _voEvent2['default']();
                    _event.presentationTime = 0;
                    _event.eventStream = eventStream;

                    if (currentMpdEvent.hasOwnProperty(_constantsDashConstants2['default'].PRESENTATION_TIME)) {
                        _event.presentationTime = currentMpdEvent.presentationTime;
                        var presentationTimeOffset = eventStream.presentationTimeOffset ? eventStream.presentationTimeOffset / eventStream.timescale : 0;
                        _event.calculatedPresentationTime = _event.presentationTime / eventStream.timescale + period.start - presentationTimeOffset;
                    }
                    if (currentMpdEvent.hasOwnProperty(_constantsDashConstants2['default'].DURATION)) {
                        _event.duration = currentMpdEvent.duration / eventStream.timescale;
                    }
                    if (currentMpdEvent.hasOwnProperty(_constantsDashConstants2['default'].ID)) {
                        _event.id = currentMpdEvent.id;
                    }

                    if (currentMpdEvent.Signal && currentMpdEvent.Signal.Binary) {
                        // toString is used to manage both regular and namespaced tags
                        _event.messageData = BASE64.decodeArray(currentMpdEvent.Signal.Binary.toString());
                    } else {
                        // From Cor.1: 'NOTE: this attribute is an alternative
                        // to specifying a complete XML element(s) in the Event.
                        // It is useful when an event leans itself to a compact
                        // string representation'.
                        _event.messageData = currentMpdEvent.messageData || currentMpdEvent.__text;
                    }

                    events.push(_event);
                }
            }
        }

        return events;
    }

    function getEventStreams(inbandStreams, representation) {
        var eventStreams = [];
        var i = undefined;

        if (!inbandStreams) return eventStreams;

        for (i = 0; i < inbandStreams.length; i++) {
            var eventStream = new _voEventStream2['default']();
            eventStream.timescale = 1;
            eventStream.representation = representation;

            if (inbandStreams[i].hasOwnProperty(_streamingConstantsConstants2['default'].SCHEME_ID_URI)) {
                eventStream.schemeIdUri = inbandStreams[i].schemeIdUri;
            } else {
                throw new Error('Invalid EventStream. SchemeIdUri has to be set');
            }
            if (inbandStreams[i].hasOwnProperty(_constantsDashConstants2['default'].TIMESCALE)) {
                eventStream.timescale = inbandStreams[i].timescale;
            }
            if (inbandStreams[i].hasOwnProperty(_constantsDashConstants2['default'].VALUE)) {
                eventStream.value = inbandStreams[i].value;
            }
            eventStreams.push(eventStream);
        }

        return eventStreams;
    }

    function getEventStreamForAdaptationSet(manifest, adaptation) {
        var inbandStreams = undefined,
            periodArray = undefined,
            adaptationArray = undefined;

        if (manifest && manifest.Period_asArray && adaptation && adaptation.period && isInteger(adaptation.period.index)) {
            periodArray = manifest.Period_asArray[adaptation.period.index];
            if (periodArray && periodArray.AdaptationSet_asArray && isInteger(adaptation.index)) {
                adaptationArray = periodArray.AdaptationSet_asArray[adaptation.index];
                if (adaptationArray) {
                    inbandStreams = adaptationArray.InbandEventStream_asArray;
                }
            }
        }

        return getEventStreams(inbandStreams, null);
    }

    function getEventStreamForRepresentation(manifest, representation) {
        var inbandStreams = undefined,
            periodArray = undefined,
            adaptationArray = undefined,
            representationArray = undefined;

        if (manifest && manifest.Period_asArray && representation && representation.adaptation && representation.adaptation.period && isInteger(representation.adaptation.period.index)) {
            periodArray = manifest.Period_asArray[representation.adaptation.period.index];
            if (periodArray && periodArray.AdaptationSet_asArray && isInteger(representation.adaptation.index)) {
                adaptationArray = periodArray.AdaptationSet_asArray[representation.adaptation.index];
                if (adaptationArray && adaptationArray.Representation_asArray && isInteger(representation.index)) {
                    representationArray = adaptationArray.Representation_asArray[representation.index];
                    if (representationArray) {
                        inbandStreams = representationArray.InbandEventStream_asArray;
                    }
                }
            }
        }

        return getEventStreams(inbandStreams, representation);
    }

    function getUTCTimingSources(manifest) {
        var isDynamic = getIsDynamic(manifest);
        var hasAST = manifest ? manifest.hasOwnProperty(_constantsDashConstants2['default'].AVAILABILITY_START_TIME) : false;
        var utcTimingsArray = manifest ? manifest.UTCTiming_asArray : null;
        var utcTimingEntries = [];

        // do not bother synchronizing the clock unless MPD is live,
        // or it is static and has availabilityStartTime attribute
        if (isDynamic || hasAST) {
            if (utcTimingsArray) {
                // the order is important here - 23009-1 states that the order
                // in the manifest "indicates relative preference, first having
                // the highest, and the last the lowest priority".
                utcTimingsArray.forEach(function (utcTiming) {
                    var entry = new _voUTCTiming2['default']();

                    if (utcTiming.hasOwnProperty(_streamingConstantsConstants2['default'].SCHEME_ID_URI)) {
                        entry.schemeIdUri = utcTiming.schemeIdUri;
                    } else {
                        // entries of type DescriptorType with no schemeIdUri
                        // are meaningless. let's just ignore this entry and
                        // move on.
                        return;
                    }

                    // this is (incorrectly) interpreted as a number - schema
                    // defines it as a string
                    if (utcTiming.hasOwnProperty(_constantsDashConstants2['default'].VALUE)) {
                        entry.value = utcTiming.value.toString();
                    } else {
                        // without a value, there's not a lot we can do with
                        // this entry. let's just ignore this one and move on
                        return;
                    }

                    // we're not interested in the optional id or any other
                    // attributes which might be attached to the entry

                    utcTimingEntries.push(entry);
                });
            }
        }

        return utcTimingEntries;
    }

    function getBaseURLsFromElement(node) {
        var baseUrls = [];
        // if node.BaseURL_asArray and node.baseUri are undefined entries
        // will be [undefined] which entries.some will just skip
        var entries = node.BaseURL_asArray || [node.baseUri];
        var earlyReturn = false;

        entries.some(function (entry) {
            if (entry) {
                var baseUrl = new _voBaseURL2['default']();
                var text = entry.__text || entry;

                if (urlUtils.isRelative(text)) {
                    // it doesn't really make sense to have relative and
                    // absolute URLs at the same level, or multiple
                    // relative URLs at the same level, so assume we are
                    // done from this level of the MPD
                    earlyReturn = true;

                    // deal with the specific case where the MPD@BaseURL
                    // is specified and is relative. when no MPD@BaseURL
                    // entries exist, that case is handled by the
                    // [node.baseUri] in the entries definition.
                    if (node.baseUri) {
                        text = urlUtils.resolve(text, node.baseUri);
                    }
                }

                baseUrl.url = text;

                // serviceLocation is optional, but we need it in order
                // to blacklist correctly. if it's not available, use
                // anything unique since there's no relationship to any
                // other BaseURL and, in theory, the url should be
                // unique so use this instead.
                if (entry.hasOwnProperty(_constantsDashConstants2['default'].SERVICE_LOCATION) && entry.serviceLocation.length) {
                    baseUrl.serviceLocation = entry.serviceLocation;
                } else {
                    baseUrl.serviceLocation = text;
                }

                if (entry.hasOwnProperty(_constantsDashConstants2['default'].DVB_PRIORITY)) {
                    baseUrl.dvb_priority = entry[_constantsDashConstants2['default'].DVB_PRIORITY];
                }

                if (entry.hasOwnProperty(_constantsDashConstants2['default'].DVB_WEIGHT)) {
                    baseUrl.dvb_weight = entry[_constantsDashConstants2['default'].DVB_WEIGHT];
                }

                if (entry.hasOwnProperty(_constantsDashConstants2['default'].AVAILABILITY_TIME_OFFSET)) {
                    baseUrl.availabilityTimeOffset = entry[_constantsDashConstants2['default'].AVAILABILITY_TIME_OFFSET];
                }

                if (entry.hasOwnProperty(_constantsDashConstants2['default'].AVAILABILITY_TIME_COMPLETE)) {
                    baseUrl.availabilityTimeComplete = entry[_constantsDashConstants2['default'].AVAILABILITY_TIME_COMPLETE] !== 'false';
                }
                /* NOTE: byteRange currently unused
                 */

                baseUrls.push(baseUrl);

                return earlyReturn;
            }
        });

        return baseUrls;
    }

    function getLocation(manifest) {
        if (manifest && manifest.hasOwnProperty(_streamingConstantsConstants2['default'].LOCATION)) {
            // for now, do not support multiple Locations -
            // just set Location to the first Location.
            manifest.Location = manifest.Location_asArray[0];

            return manifest.Location;
        }

        // may well be undefined
        return undefined;
    }

    function getPatchLocation(manifest) {
        if (manifest && manifest.hasOwnProperty(_constantsDashConstants2['default'].PATCH_LOCATION)) {
            // only include support for single patch location currently
            manifest.PatchLocation = manifest.PatchLocation_asArray[0];

            return manifest.PatchLocation;
        }

        // no patch location provided
        return undefined;
    }

    function getSuggestedPresentationDelay(mpd) {
        return mpd && mpd.hasOwnProperty(_constantsDashConstants2['default'].SUGGESTED_PRESENTATION_DELAY) ? mpd.suggestedPresentationDelay : null;
    }

    function getAvailabilityStartTime(mpd) {
        return mpd && mpd.hasOwnProperty(_constantsDashConstants2['default'].AVAILABILITY_START_TIME) && mpd.availabilityStartTime !== null ? mpd.availabilityStartTime.getTime() : null;
    }

    function getServiceDescriptions(manifest) {
        var serviceDescriptions = [];
        if (manifest && manifest.hasOwnProperty(_constantsDashConstants2['default'].SERVICE_DESCRIPTION)) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = manifest.ServiceDescription_asArray[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var sd = _step.value;

                    // Convert each of the properties defined in
                    var id = undefined,
                        schemeIdUri = undefined,
                        latency = undefined,
                        playbackRate = undefined;
                    for (var prop in sd) {
                        if (sd.hasOwnProperty(prop)) {
                            if (prop === _constantsDashConstants2['default'].ID) {
                                id = sd[prop];
                            } else if (prop === _constantsDashConstants2['default'].SERVICE_DESCRIPTION_SCOPE) {
                                schemeIdUri = sd[prop].schemeIdUri;
                            } else if (prop === _constantsDashConstants2['default'].SERVICE_DESCRIPTION_LATENCY) {
                                latency = {
                                    target: sd[prop].target,
                                    max: sd[prop].max,
                                    min: sd[prop].min
                                };
                            } else if (prop === _constantsDashConstants2['default'].SERVICE_DESCRIPTION_PLAYBACK_RATE) {
                                playbackRate = {
                                    max: sd[prop].max,
                                    min: sd[prop].min
                                };
                            }
                        }
                    }
                    // we have a ServiceDescription for low latency. Add it if it really has parameters defined
                    if (schemeIdUri === _streamingConstantsConstants2['default'].SERVICE_DESCRIPTION_LL_SCHEME && (latency || playbackRate)) {
                        serviceDescriptions.push({
                            id: id,
                            schemeIdUri: schemeIdUri,
                            latency: latency,
                            playbackRate: playbackRate
                        });
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator['return']) {
                        _iterator['return']();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }

        return serviceDescriptions;
    }

    function getSupplementalPropperties(adaptation) {
        var supplementalProperties = {};

        if (adaptation && adaptation.hasOwnProperty(_constantsDashConstants2['default'].SUPPLEMENTAL_PROPERTY)) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = adaptation.SupplementalProperty_asArray[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var sp = _step2.value;

                    if (sp.hasOwnProperty(_streamingConstantsConstants2['default'].SCHEME_ID_URI) && sp.hasOwnProperty(_constantsDashConstants2['default'].VALUE)) {
                        supplementalProperties[sp[_streamingConstantsConstants2['default'].SCHEME_ID_URI]] = sp[_constantsDashConstants2['default'].VALUE];
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                        _iterator2['return']();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }
        return supplementalProperties;
    }

    function setConfig(config) {
        if (!config) return;

        if (config.errHandler) {
            errHandler = config.errHandler;
        }

        if (config.BASE64) {
            BASE64 = config.BASE64;
        }
    }

    instance = {
        getIsTypeOf: getIsTypeOf,
        getIsTextTrack: getIsTextTrack,
        getLanguageForAdaptation: getLanguageForAdaptation,
        getViewpointForAdaptation: getViewpointForAdaptation,
        getRolesForAdaptation: getRolesForAdaptation,
        getAccessibilityForAdaptation: getAccessibilityForAdaptation,
        getAudioChannelConfigurationForAdaptation: getAudioChannelConfigurationForAdaptation,
        getAudioChannelConfigurationForRepresentation: getAudioChannelConfigurationForRepresentation,
        getAdaptationForIndex: getAdaptationForIndex,
        getIndexForAdaptation: getIndexForAdaptation,
        getAdaptationForId: getAdaptationForId,
        getAdaptationsForType: getAdaptationsForType,
        getRealPeriods: getRealPeriods,
        getRealPeriodForIndex: getRealPeriodForIndex,
        getCodec: getCodec,
        getMimeType: getMimeType,
        getKID: getKID,
        getLabelsForAdaptation: getLabelsForAdaptation,
        getContentProtectionData: getContentProtectionData,
        getIsDynamic: getIsDynamic,
        getId: getId,
        hasProfile: hasProfile,
        getDuration: getDuration,
        getBandwidth: getBandwidth,
        getManifestUpdatePeriod: getManifestUpdatePeriod,
        getPublishTime: getPublishTime,
        getRepresentationCount: getRepresentationCount,
        getBitrateListForAdaptation: getBitrateListForAdaptation,
        getRepresentationFor: getRepresentationFor,
        getRepresentationsForAdaptation: getRepresentationsForAdaptation,
        getAdaptationsForPeriod: getAdaptationsForPeriod,
        getRegularPeriods: getRegularPeriods,
        getMpd: getMpd,
        getEventsForPeriod: getEventsForPeriod,
        getEssentialPropertiesForRepresentation: getEssentialPropertiesForRepresentation,
        getEventStreamForAdaptationSet: getEventStreamForAdaptationSet,
        getEventStreamForRepresentation: getEventStreamForRepresentation,
        getUTCTimingSources: getUTCTimingSources,
        getBaseURLsFromElement: getBaseURLsFromElement,
        getRepresentationSortFunction: getRepresentationSortFunction,
        getLocation: getLocation,
        getPatchLocation: getPatchLocation,
        getSuggestedPresentationDelay: getSuggestedPresentationDelay,
        getAvailabilityStartTime: getAvailabilityStartTime,
        getServiceDescriptions: getServiceDescriptions,
        getSupplementalPropperties: getSupplementalPropperties,
        setConfig: setConfig
    };

    setup();

    return instance;
}

DashManifestModel.__dashjs_factory_name = 'DashManifestModel';
exports['default'] = _coreFactoryMaker2['default'].getSingletonFactory(DashManifestModel);
module.exports = exports['default'];

},{"11":11,"14":14,"20":20,"40":40,"41":41,"42":42,"43":43,"44":44,"45":45,"46":46,"48":48,"65":65,"74":74,"78":78,"80":80,"81":81,"9":9}],24:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _objectiron = _dereq_(34);

var _objectiron2 = _interopRequireDefault(_objectiron);

var _externalsXml2json = _dereq_(1);

var _externalsXml2json2 = _interopRequireDefault(_externalsXml2json);

var _matchersStringMatcher = _dereq_(33);

var _matchersStringMatcher2 = _interopRequireDefault(_matchersStringMatcher);

var _matchersDurationMatcher = _dereq_(31);

var _matchersDurationMatcher2 = _interopRequireDefault(_matchersDurationMatcher);

var _matchersDateTimeMatcher = _dereq_(30);

var _matchersDateTimeMatcher2 = _interopRequireDefault(_matchersDateTimeMatcher);

var _matchersNumericMatcher = _dereq_(32);

var _matchersNumericMatcher2 = _interopRequireDefault(_matchersNumericMatcher);

var _mapsRepresentationBaseValuesMap = _dereq_(27);

var _mapsRepresentationBaseValuesMap2 = _interopRequireDefault(_mapsRepresentationBaseValuesMap);

var _mapsSegmentValuesMap = _dereq_(28);

var _mapsSegmentValuesMap2 = _interopRequireDefault(_mapsSegmentValuesMap);

function DashParser(config) {

    config = config || {};
    var context = this.context;
    var debug = config.debug;

    var instance = undefined,
        logger = undefined,
        matchers = undefined,
        converter = undefined,
        objectIron = undefined;

    function setup() {
        logger = debug.getLogger(instance);
        matchers = [new _matchersDurationMatcher2['default'](), new _matchersDateTimeMatcher2['default'](), new _matchersNumericMatcher2['default'](), new _matchersStringMatcher2['default']() // last in list to take precedence over NumericMatcher
        ];

        converter = new _externalsXml2json2['default']({
            escapeMode: false,
            attributePrefix: '',
            arrayAccessForm: 'property',
            emptyNodeForm: 'object',
            stripWhitespaces: false,
            enableToStringFunc: true,
            ignoreRoot: false,
            matchers: matchers
        });

        objectIron = (0, _objectiron2['default'])(context).create({
            adaptationset: new _mapsRepresentationBaseValuesMap2['default'](),
            period: new _mapsSegmentValuesMap2['default']()
        });
    }

    function getMatchers() {
        return matchers;
    }

    function getIron() {
        return objectIron;
    }

    function parse(data) {
        var manifest = undefined;
        var startTime = window.performance.now();

        manifest = converter.xml_str2json(data);

        if (!manifest) {
            throw new Error('parsing the manifest failed');
        }

        var jsonTime = window.performance.now();

        // handle full MPD and Patch ironing separately
        if (manifest.Patch) {
            manifest = manifest.Patch; // drop root reference
            // apply iron to patch operations individually
            if (manifest.add_asArray) {
                manifest.add_asArray.forEach(function (operand) {
                    return objectIron.run(operand);
                });
            }
            if (manifest.replace_asArray) {
                manifest.replace_asArray.forEach(function (operand) {
                    return objectIron.run(operand);
                });
            }
            // note that we don't need to iron remove as they contain no children
        } else {
                manifest = manifest.MPD; // drop root reference
                objectIron.run(manifest);
            }

        var ironedTime = window.performance.now();
        logger.info('Parsing complete: ( xml2json: ' + (jsonTime - startTime).toPrecision(3) + 'ms, objectiron: ' + (ironedTime - jsonTime).toPrecision(3) + 'ms, total: ' + ((ironedTime - startTime) / 1000).toPrecision(3) + 's)');

        manifest.protocol = 'DASH';

        return manifest;
    }

    instance = {
        parse: parse,
        getMatchers: getMatchers,
        getIron: getIron
    };

    setup();

    return instance;
}

DashParser.__dashjs_factory_name = 'DashParser';
exports['default'] = _coreFactoryMaker2['default'].getClassFactory(DashParser);
module.exports = exports['default'];

},{"1":1,"11":11,"27":27,"28":28,"30":30,"31":31,"32":32,"33":33,"34":34}],25:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @classdesc a property belonging to a MapNode
 * @ignore
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CommonProperty = (function () {
    function CommonProperty(name) {
        _classCallCheck(this, CommonProperty);

        var getDefaultMergeForName = function getDefaultMergeForName(n) {
            return n && n.length && n.charAt(0) === n.charAt(0).toUpperCase();
        };

        this._name = name;
        this._merge = getDefaultMergeForName(name);
    }

    _createClass(CommonProperty, [{
        key: "name",
        get: function get() {
            return this._name;
        }
    }, {
        key: "merge",
        get: function get() {
            return this._merge;
        }
    }]);

    return CommonProperty;
})();

exports["default"] = CommonProperty;
module.exports = exports["default"];

},{}],26:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @classdesc a node at some level in a ValueMap
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _CommonProperty = _dereq_(25);

var _CommonProperty2 = _interopRequireDefault(_CommonProperty);

var MapNode = (function () {
    function MapNode(name, properties, children) {
        var _this = this;

        _classCallCheck(this, MapNode);

        this._name = name || '';
        this._properties = [];
        this._children = children || [];

        if (Array.isArray(properties)) {
            properties.forEach(function (p) {
                _this._properties.push(new _CommonProperty2['default'](p));
            });
        }
    }

    _createClass(MapNode, [{
        key: 'name',
        get: function get() {
            return this._name;
        }
    }, {
        key: 'children',
        get: function get() {
            return this._children;
        }
    }, {
        key: 'properties',
        get: function get() {
            return this._properties;
        }
    }]);

    return MapNode;
})();

exports['default'] = MapNode;
module.exports = exports['default'];

},{"25":25}],27:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @classdesc a RepresentationBaseValuesMap type for input to objectiron
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _MapNode2 = _dereq_(26);

var _MapNode3 = _interopRequireDefault(_MapNode2);

var _constantsDashConstants = _dereq_(20);

var _constantsDashConstants2 = _interopRequireDefault(_constantsDashConstants);

var RepresentationBaseValuesMap = (function (_MapNode) {
    _inherits(RepresentationBaseValuesMap, _MapNode);

    function RepresentationBaseValuesMap() {
        _classCallCheck(this, RepresentationBaseValuesMap);

        var commonProperties = [_constantsDashConstants2['default'].PROFILES, _constantsDashConstants2['default'].WIDTH, _constantsDashConstants2['default'].HEIGHT, _constantsDashConstants2['default'].SAR, _constantsDashConstants2['default'].FRAMERATE, _constantsDashConstants2['default'].AUDIO_SAMPLING_RATE, _constantsDashConstants2['default'].MIME_TYPE, _constantsDashConstants2['default'].SEGMENT_PROFILES, _constantsDashConstants2['default'].CODECS, _constantsDashConstants2['default'].MAXIMUM_SAP_PERIOD, _constantsDashConstants2['default'].START_WITH_SAP, _constantsDashConstants2['default'].MAX_PLAYOUT_RATE, _constantsDashConstants2['default'].CODING_DEPENDENCY, _constantsDashConstants2['default'].SCAN_TYPE, _constantsDashConstants2['default'].FRAME_PACKING, _constantsDashConstants2['default'].AUDIO_CHANNEL_CONFIGURATION, _constantsDashConstants2['default'].CONTENT_PROTECTION, _constantsDashConstants2['default'].ESSENTIAL_PROPERTY, _constantsDashConstants2['default'].SUPPLEMENTAL_PROPERTY, _constantsDashConstants2['default'].INBAND_EVENT_STREAM];

        _get(Object.getPrototypeOf(RepresentationBaseValuesMap.prototype), 'constructor', this).call(this, _constantsDashConstants2['default'].ADAPTATION_SET, commonProperties, [new _MapNode3['default'](_constantsDashConstants2['default'].REPRESENTATION, commonProperties, [new _MapNode3['default'](_constantsDashConstants2['default'].SUB_REPRESENTATION, commonProperties)])]);
    }

    return RepresentationBaseValuesMap;
})(_MapNode3['default']);

exports['default'] = RepresentationBaseValuesMap;
module.exports = exports['default'];

},{"20":20,"26":26}],28:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @classdesc a SegmentValuesMap type for input to objectiron
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _MapNode2 = _dereq_(26);

var _MapNode3 = _interopRequireDefault(_MapNode2);

var _constantsDashConstants = _dereq_(20);

var _constantsDashConstants2 = _interopRequireDefault(_constantsDashConstants);

var SegmentValuesMap = (function (_MapNode) {
    _inherits(SegmentValuesMap, _MapNode);

    function SegmentValuesMap() {
        _classCallCheck(this, SegmentValuesMap);

        var commonProperties = [_constantsDashConstants2['default'].SEGMENT_BASE, _constantsDashConstants2['default'].SEGMENT_TEMPLATE, _constantsDashConstants2['default'].SEGMENT_LIST];

        _get(Object.getPrototypeOf(SegmentValuesMap.prototype), 'constructor', this).call(this, _constantsDashConstants2['default'].PERIOD, commonProperties, [new _MapNode3['default'](_constantsDashConstants2['default'].ADAPTATION_SET, commonProperties, [new _MapNode3['default'](_constantsDashConstants2['default'].REPRESENTATION, commonProperties)])]);
    }

    return SegmentValuesMap;
})(_MapNode3['default']);

exports['default'] = SegmentValuesMap;
module.exports = exports['default'];

},{"20":20,"26":26}],29:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @classdesc a base type for matching and converting types in manifest to
 * something more useful
 * @ignore
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BaseMatcher = (function () {
    function BaseMatcher(test, converter) {
        _classCallCheck(this, BaseMatcher);

        this._test = test;
        this._converter = converter;
    }

    _createClass(BaseMatcher, [{
        key: "test",
        get: function get() {
            return this._test;
        }
    }, {
        key: "converter",
        get: function get() {
            return this._converter;
        }
    }]);

    return BaseMatcher;
})();

exports["default"] = BaseMatcher;
module.exports = exports["default"];

},{}],30:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @classdesc matches and converts xs:datetime to Date
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _BaseMatcher2 = _dereq_(29);

var _BaseMatcher3 = _interopRequireDefault(_BaseMatcher2);

var SECONDS_IN_MIN = 60;
var MINUTES_IN_HOUR = 60;
var MILLISECONDS_IN_SECONDS = 1000;

var datetimeRegex = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2})(?::([0-9]*)(\.[0-9]*)?)?(?:([+-])([0-9]{2})(?::?)([0-9]{2}))?/;

var DateTimeMatcher = (function (_BaseMatcher) {
    _inherits(DateTimeMatcher, _BaseMatcher);

    function DateTimeMatcher() {
        _classCallCheck(this, DateTimeMatcher);

        _get(Object.getPrototypeOf(DateTimeMatcher.prototype), 'constructor', this).call(this, function (attr) {
            return datetimeRegex.test(attr.value);
        }, function (str) {
            var match = datetimeRegex.exec(str);
            var utcDate = undefined;

            // If the string does not contain a timezone offset different browsers can interpret it either
            // as UTC or as a local time so we have to parse the string manually to normalize the given date value for
            // all browsers
            utcDate = Date.UTC(parseInt(match[1], 10), parseInt(match[2], 10) - 1, // months start from zero
            parseInt(match[3], 10), parseInt(match[4], 10), parseInt(match[5], 10), match[6] && parseInt(match[6], 10) || 0, match[7] && parseFloat(match[7]) * MILLISECONDS_IN_SECONDS || 0);

            // If the date has timezone offset take it into account as well
            if (match[9] && match[10]) {
                var timezoneOffset = parseInt(match[9], 10) * MINUTES_IN_HOUR + parseInt(match[10], 10);
                utcDate += (match[8] === '+' ? -1 : +1) * timezoneOffset * SECONDS_IN_MIN * MILLISECONDS_IN_SECONDS;
            }

            return new Date(utcDate);
        });
    }

    return DateTimeMatcher;
})(_BaseMatcher3['default']);

exports['default'] = DateTimeMatcher;
module.exports = exports['default'];

},{"29":29}],31:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @classdesc matches and converts xs:duration to seconds
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _BaseMatcher2 = _dereq_(29);

var _BaseMatcher3 = _interopRequireDefault(_BaseMatcher2);

var _streamingConstantsConstants = _dereq_(65);

var _streamingConstantsConstants2 = _interopRequireDefault(_streamingConstantsConstants);

var _constantsDashConstants = _dereq_(20);

var _constantsDashConstants2 = _interopRequireDefault(_constantsDashConstants);

var durationRegex = /^([-])?P(([\d.]*)Y)?(([\d.]*)M)?(([\d.]*)D)?T?(([\d.]*)H)?(([\d.]*)M)?(([\d.]*)S)?/;

var SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
var SECONDS_IN_MONTH = 30 * 24 * 60 * 60;
var SECONDS_IN_DAY = 24 * 60 * 60;
var SECONDS_IN_HOUR = 60 * 60;
var SECONDS_IN_MIN = 60;

var DurationMatcher = (function (_BaseMatcher) {
    _inherits(DurationMatcher, _BaseMatcher);

    function DurationMatcher() {
        _classCallCheck(this, DurationMatcher);

        _get(Object.getPrototypeOf(DurationMatcher.prototype), 'constructor', this).call(this, function (attr) {
            var attributeList = [_constantsDashConstants2['default'].MIN_BUFFER_TIME, _constantsDashConstants2['default'].MEDIA_PRESENTATION_DURATION, _constantsDashConstants2['default'].MINIMUM_UPDATE_PERIOD, _constantsDashConstants2['default'].TIMESHIFT_BUFFER_DEPTH, _constantsDashConstants2['default'].MAX_SEGMENT_DURATION, _constantsDashConstants2['default'].MAX_SUBSEGMENT_DURATION, _constantsDashConstants2['default'].SUGGESTED_PRESENTATION_DELAY, _constantsDashConstants2['default'].START, _streamingConstantsConstants2['default'].START_TIME, _constantsDashConstants2['default'].DURATION];
            var len = attributeList.length;

            for (var i = 0; i < len; i++) {
                if (attr.nodeName === attributeList[i]) {
                    return durationRegex.test(attr.value);
                }
            }

            return false;
        }, function (str) {
            //str = "P10Y10M10DT10H10M10.1S";
            var match = durationRegex.exec(str);
            var result = parseFloat(match[3] || 0) * SECONDS_IN_YEAR + parseFloat(match[5] || 0) * SECONDS_IN_MONTH + parseFloat(match[7] || 0) * SECONDS_IN_DAY + parseFloat(match[9] || 0) * SECONDS_IN_HOUR + parseFloat(match[11] || 0) * SECONDS_IN_MIN + parseFloat(match[13] || 0);

            if (match[1] !== undefined) {
                result = -result;
            }

            return result;
        });
    }

    return DurationMatcher;
})(_BaseMatcher3['default']);

exports['default'] = DurationMatcher;
module.exports = exports['default'];

},{"20":20,"29":29,"65":65}],32:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @classdesc Matches and converts xs:numeric to float
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _BaseMatcher2 = _dereq_(29);

var _BaseMatcher3 = _interopRequireDefault(_BaseMatcher2);

var numericRegex = /^[-+]?[0-9]+[.]?[0-9]*([eE][-+]?[0-9]+)?$/;

var NumericMatcher = (function (_BaseMatcher) {
    _inherits(NumericMatcher, _BaseMatcher);

    function NumericMatcher() {
        _classCallCheck(this, NumericMatcher);

        _get(Object.getPrototypeOf(NumericMatcher.prototype), 'constructor', this).call(this, function (attr) {
            return numericRegex.test(attr.value);
        }, function (str) {
            return parseFloat(str);
        });
    }

    return NumericMatcher;
})(_BaseMatcher3['default']);

exports['default'] = NumericMatcher;
module.exports = exports['default'];

},{"29":29}],33:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @classdesc Matches and converts xs:string to string, but only for specific attributes on specific nodes
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _BaseMatcher2 = _dereq_(29);

var _BaseMatcher3 = _interopRequireDefault(_BaseMatcher2);

var _constantsDashConstants = _dereq_(20);

var _constantsDashConstants2 = _interopRequireDefault(_constantsDashConstants);

var StringMatcher = (function (_BaseMatcher) {
    _inherits(StringMatcher, _BaseMatcher);

    function StringMatcher() {
        _classCallCheck(this, StringMatcher);

        _get(Object.getPrototypeOf(StringMatcher.prototype), 'constructor', this).call(this, function (attr, nodeName) {
            var _stringAttrsInElements;

            var stringAttrsInElements = (_stringAttrsInElements = {}, _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].MPD, [_constantsDashConstants2['default'].ID, _constantsDashConstants2['default'].PROFILES]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].PERIOD, [_constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].BASE_URL, [_constantsDashConstants2['default'].SERVICE_LOCATION, _constantsDashConstants2['default'].BYTE_RANGE]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].SEGMENT_BASE, [_constantsDashConstants2['default'].INDEX_RANGE]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].INITIALIZATION, [_constantsDashConstants2['default'].RANGE]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].REPRESENTATION_INDEX, [_constantsDashConstants2['default'].RANGE]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].SEGMENT_LIST, [_constantsDashConstants2['default'].INDEX_RANGE]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].BITSTREAM_SWITCHING, [_constantsDashConstants2['default'].RANGE]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].SEGMENT_URL, [_constantsDashConstants2['default'].MEDIA_RANGE, _constantsDashConstants2['default'].INDEX_RANGE]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].SEGMENT_TEMPLATE, [_constantsDashConstants2['default'].INDEX_RANGE, _constantsDashConstants2['default'].MEDIA, _constantsDashConstants2['default'].INDEX, _constantsDashConstants2['default'].INITIALIZATION_MINUS, _constantsDashConstants2['default'].BITSTREAM_SWITCHING_MINUS]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].ASSET_IDENTIFIER, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].EVENT_STREAM, [_constantsDashConstants2['default'].VALUE]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].ADAPTATION_SET, [_constantsDashConstants2['default'].PROFILES, _constantsDashConstants2['default'].MIME_TYPE, _constantsDashConstants2['default'].SEGMENT_PROFILES, _constantsDashConstants2['default'].CODECS, _constantsDashConstants2['default'].CONTENT_TYPE]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].FRAME_PACKING, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].AUDIO_CHANNEL_CONFIGURATION, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].CONTENT_PROTECTION, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].ESSENTIAL_PROPERTY, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].SUPPLEMENTAL_PROPERTY, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].INBAND_EVENT_STREAM, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].ACCESSIBILITY, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].ROLE, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].RATING, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].VIEWPOINT, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].CONTENT_COMPONENT, [_constantsDashConstants2['default'].CONTENT_TYPE]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].REPRESENTATION, [_constantsDashConstants2['default'].ID, _constantsDashConstants2['default'].DEPENDENCY_ID, _constantsDashConstants2['default'].MEDIA_STREAM_STRUCTURE_ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].SUBSET, [_constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].METRICS, [_constantsDashConstants2['default'].METRICS_MINUS]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].REPORTING, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _stringAttrsInElements);
            if (stringAttrsInElements.hasOwnProperty(nodeName)) {
                var attrNames = stringAttrsInElements[nodeName];
                if (attrNames !== undefined) {
                    return attrNames.indexOf(attr.name) >= 0;
                } else {
                    return false;
                }
            }
            return false;
        }, function (str) {
            return String(str);
        });
    }

    return StringMatcher;
})(_BaseMatcher3['default']);

exports['default'] = StringMatcher;
module.exports = exports['default'];

},{"20":20,"29":29}],34:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

function ObjectIron(mappers) {

    function mergeValues(parentItem, childItem) {
        for (var _name in parentItem) {
            if (!childItem.hasOwnProperty(_name)) {
                childItem[_name] = parentItem[_name];
            }
        }
    }

    function mapProperties(properties, parent, child) {
        for (var i = 0, len = properties.length; i < len; ++i) {
            var property = properties[i];

            if (parent[property.name]) {
                if (child[property.name]) {
                    // check to see if we should merge
                    if (property.merge) {
                        var parentValue = parent[property.name];
                        var childValue = child[property.name];

                        // complex objects; merge properties
                        if (typeof parentValue === 'object' && typeof childValue === 'object') {
                            mergeValues(parentValue, childValue);
                        }
                        // simple objects; merge them together
                        else {
                                child[property.name] = parentValue + childValue;
                            }
                    }
                } else {
                    // just add the property
                    child[property.name] = parent[property.name];
                }
            }
        }
    }

    function mapItem(item, node) {
        for (var i = 0, len = item.children.length; i < len; ++i) {
            var childItem = item.children[i];

            var array = node[childItem.name + '_asArray'];
            if (array) {
                for (var v = 0, len2 = array.length; v < len2; ++v) {
                    var childNode = array[v];
                    mapProperties(item.properties, node, childNode);
                    mapItem(childItem, childNode);
                }
            }
        }
    }

    function run(source) {

        if (source === null || typeof source !== 'object') {
            return source;
        }

        if (source.Period_asArray && 'period' in mappers) {
            var periodMapper = mappers.period;
            var periods = source.Period_asArray;
            for (var i = 0, len = periods.length; i < len; ++i) {
                var period = periods[i];
                mapItem(periodMapper, period);

                if ('adaptationset' in mappers) {
                    var adaptationSets = period.AdaptationSet_asArray;
                    if (adaptationSets) {
                        var adaptationSetMapper = mappers.adaptationset;
                        for (var _i = 0, _len = adaptationSets.length; _i < _len; ++_i) {
                            mapItem(adaptationSetMapper, adaptationSets[_i]);
                        }
                    }
                }
            }
        }

        return source;
    }

    return {
        run: run
    };
}

ObjectIron.__dashjs_factory_name = 'ObjectIron';
var factory = _coreFactoryMaker2['default'].getClassFactory(ObjectIron);
exports['default'] = factory;
module.exports = exports['default'];

},{"11":11}],35:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _streamingConstantsConstants = _dereq_(65);

var _streamingConstantsConstants2 = _interopRequireDefault(_streamingConstantsConstants);

var _SegmentsUtils = _dereq_(37);

function ListSegmentsGetter(config, isDynamic) {

    config = config || {};
    var timelineConverter = config.timelineConverter;

    var instance = undefined;

    function checkConfig() {
        if (!timelineConverter || !timelineConverter.hasOwnProperty('calcPeriodRelativeTimeFromMpdRelativeTime')) {
            throw new Error(_streamingConstantsConstants2['default'].MISSING_CONFIG_ERROR);
        }
    }

    function getSegmentByIndex(representation, index) {
        checkConfig();

        if (!representation) {
            return null;
        }

        var list = representation.adaptation.period.mpd.manifest.Period_asArray[representation.adaptation.period.index].AdaptationSet_asArray[representation.adaptation.index].Representation_asArray[representation.index].SegmentList;
        var len = list.SegmentURL_asArray.length;

        var startNumber = representation && !isNaN(representation.startNumber) ? representation.startNumber : 1;
        var offsetToSubtract = Math.max(startNumber - 1, 0);

        var relativeIndex = Math.max(index - offsetToSubtract, 0);

        var segment = null;
        if (relativeIndex < len) {
            var s = list.SegmentURL_asArray[relativeIndex];

            segment = (0, _SegmentsUtils.getIndexBasedSegment)(timelineConverter, isDynamic, representation, index);
            if (segment) {
                segment.replacementTime = (startNumber + index - 1) * representation.segmentDuration;
                segment.media = s.media ? s.media : '';
                segment.mediaRange = s.mediaRange;
                segment.index = index;
                segment.indexRange = s.indexRange;
            }
        }

        representation.availableSegmentsNumber = len;

        return segment;
    }

    function getSegmentByTime(representation, requestedTime) {
        checkConfig();

        if (!representation) {
            return null;
        }

        var duration = representation.segmentDuration;

        if (isNaN(duration)) {
            return null;
        }

        var periodTime = timelineConverter.calcPeriodRelativeTimeFromMpdRelativeTime(representation, requestedTime);
        var index = Math.floor(periodTime / duration);

        return getSegmentByIndex(representation, index);
    }

    instance = {
        getSegmentByIndex: getSegmentByIndex,
        getSegmentByTime: getSegmentByTime
    };

    return instance;
}

ListSegmentsGetter.__dashjs_factory_name = 'ListSegmentsGetter';
var factory = _coreFactoryMaker2['default'].getClassFactory(ListSegmentsGetter);
exports['default'] = factory;
module.exports = exports['default'];

},{"11":11,"37":37,"65":65}],36:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _streamingConstantsConstants = _dereq_(65);

var _streamingConstantsConstants2 = _interopRequireDefault(_streamingConstantsConstants);

function SegmentBaseGetter(config) {

    config = config || {};
    var timelineConverter = config.timelineConverter;

    var instance = undefined;

    function checkConfig() {
        if (!timelineConverter || !timelineConverter.hasOwnProperty('calcPeriodRelativeTimeFromMpdRelativeTime')) {
            throw new Error(_streamingConstantsConstants2['default'].MISSING_CONFIG_ERROR);
        }
    }

    function getSegmentByIndex(representation, index) {
        checkConfig();

        if (!representation) {
            return null;
        }

        var len = representation.segments ? representation.segments.length : -1;
        var seg = undefined;
        if (index < len) {
            seg = representation.segments[index];
            if (seg && seg.availabilityIdx === index) {
                return seg;
            }
        }

        for (var i = 0; i < len; i++) {
            seg = representation.segments[i];

            if (seg && seg.availabilityIdx === index) {
                return seg;
            }
        }

        return null;
    }

    function getSegmentByTime(representation, requestedTime) {
        checkConfig();

        var index = getIndexByTime(representation, requestedTime);

        return getSegmentByIndex(representation, index);
    }

    function getIndexByTime(representation, time) {
        if (!representation) {
            return -1;
        }

        var segments = representation.segments;
        var ln = segments ? segments.length : null;

        var idx = -1;
        var epsilon = undefined,
            frag = undefined,
            ft = undefined,
            fd = undefined,
            i = undefined;

        if (segments && ln > 0) {
            for (i = 0; i < ln; i++) {
                frag = segments[i];
                ft = frag.presentationStartTime;
                fd = frag.duration;

                epsilon = fd / 2;
                if (time + epsilon >= ft && time - epsilon < ft + fd) {
                    idx = frag.availabilityIdx;
                    break;
                }
            }
        }

        return idx;
    }

    instance = {
        getSegmentByIndex: getSegmentByIndex,
        getSegmentByTime: getSegmentByTime
    };

    return instance;
}

SegmentBaseGetter.__dashjs_factory_name = 'SegmentBaseGetter';
var factory = _coreFactoryMaker2['default'].getClassFactory(SegmentBaseGetter);
exports['default'] = factory;
module.exports = exports['default'];

},{"11":11,"65":65}],37:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.unescapeDollarsInTemplate = unescapeDollarsInTemplate;
exports.replaceIDForTemplate = replaceIDForTemplate;
exports.replaceTokenForTemplate = replaceTokenForTemplate;
exports.getIndexBasedSegment = getIndexBasedSegment;
exports.getTimeBasedSegment = getTimeBasedSegment;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _voSegment = _dereq_(47);

var _voSegment2 = _interopRequireDefault(_voSegment);

function zeroPadToLength(numStr, minStrLength) {
    while (numStr.length < minStrLength) {
        numStr = '0' + numStr;
    }
    return numStr;
}

function getNumberForSegment(segment, segmentIndex) {
    return segment.representation.startNumber + segmentIndex;
}

function unescapeDollarsInTemplate(url) {
    return url ? url.split('$$').join('$') : url;
}

function replaceIDForTemplate(url, value) {
    if (!value || !url || url.indexOf('$RepresentationID$') === -1) {
        return url;
    }
    var v = value.toString();
    return url.split('$RepresentationID$').join(v);
}

function replaceTokenForTemplate(url, token, value) {
    var formatTag = '%0';

    var startPos = undefined,
        endPos = undefined,
        formatTagPos = undefined,
        specifier = undefined,
        width = undefined,
        paddedValue = undefined;

    var tokenLen = token.length;
    var formatTagLen = formatTag.length;

    if (!url) {
        return url;
    }

    // keep looping round until all instances of <token> have been
    // replaced. once that has happened, startPos below will be -1
    // and the completed url will be returned.
    while (true) {

        // check if there is a valid $<token>...$ identifier
        // if not, return the url as is.
        startPos = url.indexOf('$' + token);
        if (startPos < 0) {
            return url;
        }

        // the next '$' must be the end of the identifier
        // if there isn't one, return the url as is.
        endPos = url.indexOf('$', startPos + tokenLen);
        if (endPos < 0) {
            return url;
        }

        // now see if there is an additional format tag suffixed to
        // the identifier within the enclosing '$' characters
        formatTagPos = url.indexOf(formatTag, startPos + tokenLen);
        if (formatTagPos > startPos && formatTagPos < endPos) {

            specifier = url.charAt(endPos - 1);
            width = parseInt(url.substring(formatTagPos + formatTagLen, endPos - 1), 10);

            // support the minimum specifiers required by IEEE 1003.1
            // (d, i , o, u, x, and X) for completeness
            switch (specifier) {
                // treat all int types as uint,
                // hence deliberate fallthrough
                case 'd':
                case 'i':
                case 'u':
                    paddedValue = zeroPadToLength(value.toString(), width);
                    break;
                case 'x':
                    paddedValue = zeroPadToLength(value.toString(16), width);
                    break;
                case 'X':
                    paddedValue = zeroPadToLength(value.toString(16), width).toUpperCase();
                    break;
                case 'o':
                    paddedValue = zeroPadToLength(value.toString(8), width);
                    break;
                default:
                    return url;
            }
        } else {
            paddedValue = value;
        }

        url = url.substring(0, startPos) + paddedValue + url.substring(endPos + 1);
    }
}

function getSegment(representation, duration, presentationStartTime, mediaStartTime, availabilityStartTime, timelineConverter, presentationEndTime, isDynamic, index) {
    var seg = new _voSegment2['default']();

    seg.representation = representation;
    seg.duration = duration;
    seg.presentationStartTime = presentationStartTime;
    seg.mediaStartTime = mediaStartTime;
    seg.availabilityStartTime = availabilityStartTime;
    seg.availabilityEndTime = timelineConverter.calcAvailabilityEndTimeFromPresentationTime(presentationEndTime, representation.adaptation.period.mpd, isDynamic);
    seg.wallStartTime = timelineConverter.calcWallTimeForSegment(seg, isDynamic);
    seg.replacementNumber = getNumberForSegment(seg, index);
    seg.availabilityIdx = index;

    return seg;
}

function isSegmentAvailable(timelineConverter, representation, segment, isDynamic) {
    var periodEnd = timelineConverter.getPeriodEnd(representation, isDynamic);
    var periodRelativeEnd = timelineConverter.calcPeriodRelativeTimeFromMpdRelativeTime(representation, periodEnd);

    var segmentTime = timelineConverter.calcPeriodRelativeTimeFromMpdRelativeTime(representation, segment.presentationStartTime);
    if (segmentTime >= periodRelativeEnd) {
        if (isDynamic) {
            // segment is not available in current period, but it may be segment available in another period that current one (in DVR window)
            // if not (time > segmentAvailabilityRange.end), then return false
            if (representation.segmentAvailabilityRange && segment.presentationStartTime >= representation.segmentAvailabilityRange.end) {
                return false;
            }
        } else {
            return false;
        }
    }

    return true;
}

function getIndexBasedSegment(timelineConverter, isDynamic, representation, index) {
    var duration = undefined,
        presentationStartTime = undefined,
        presentationEndTime = undefined;

    duration = representation.segmentDuration;

    /*
     * From spec - If neither @duration attribute nor SegmentTimeline element is present, then the Representation
     * shall contain exactly one Media Segment. The MPD start time is 0 and the MPD duration is obtained
     * in the same way as for the last Media Segment in the Representation.
     */
    if (isNaN(duration)) {
        duration = representation.adaptation.period.duration;
    }

    presentationStartTime = parseFloat((representation.adaptation.period.start + index * duration).toFixed(5));
    presentationEndTime = parseFloat((presentationStartTime + duration).toFixed(5));

    var segment = getSegment(representation, duration, presentationStartTime, timelineConverter.calcMediaTimeFromPresentationTime(presentationStartTime, representation), timelineConverter.calcAvailabilityStartTimeFromPresentationTime(presentationStartTime, representation.adaptation.period.mpd, isDynamic), timelineConverter, presentationEndTime, isDynamic, index);

    if (!isSegmentAvailable(timelineConverter, representation, segment, isDynamic)) {
        return null;
    }

    return segment;
}

function getTimeBasedSegment(timelineConverter, isDynamic, representation, time, duration, fTimescale, url, range, index, tManifest) {
    var scaledTime = time / fTimescale;
    var scaledDuration = Math.min(duration / fTimescale, representation.adaptation.period.mpd.maxSegmentDuration);

    var presentationStartTime = undefined,
        presentationEndTime = undefined,
        seg = undefined;

    presentationStartTime = timelineConverter.calcPresentationTimeFromMediaTime(scaledTime, representation);
    presentationEndTime = presentationStartTime + scaledDuration;

    seg = getSegment(representation, scaledDuration, presentationStartTime, scaledTime, representation.adaptation.period.mpd.manifest.loadedTime, timelineConverter, presentationEndTime, isDynamic, index);

    if (!isSegmentAvailable(timelineConverter, representation, seg, isDynamic)) {
        return null;
    }

    seg.replacementTime = tManifest ? tManifest : time;

    url = replaceTokenForTemplate(url, 'Number', seg.replacementNumber);
    url = replaceTokenForTemplate(url, 'Time', seg.replacementTime);
    seg.media = url;
    seg.mediaRange = range;

    return seg;
}

},{"47":47}],38:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _streamingConstantsConstants = _dereq_(65);

var _streamingConstantsConstants2 = _interopRequireDefault(_streamingConstantsConstants);

var _SegmentsUtils = _dereq_(37);

function TemplateSegmentsGetter(config, isDynamic) {
    config = config || {};
    var timelineConverter = config.timelineConverter;

    var instance = undefined;

    function checkConfig() {
        if (!timelineConverter || !timelineConverter.hasOwnProperty('calcPeriodRelativeTimeFromMpdRelativeTime')) {
            throw new Error(_streamingConstantsConstants2['default'].MISSING_CONFIG_ERROR);
        }
    }

    function getSegmentByIndex(representation, index) {
        checkConfig();

        if (!representation) {
            return null;
        }

        var template = representation.adaptation.period.mpd.manifest.Period_asArray[representation.adaptation.period.index].AdaptationSet_asArray[representation.adaptation.index].Representation_asArray[representation.index].SegmentTemplate;

        index = Math.max(index, 0);

        var seg = (0, _SegmentsUtils.getIndexBasedSegment)(timelineConverter, isDynamic, representation, index);
        if (seg) {
            seg.replacementTime = Math.round((index - 1) * representation.segmentDuration * representation.timescale, 10);

            var url = template.media;
            url = (0, _SegmentsUtils.replaceTokenForTemplate)(url, 'Number', seg.replacementNumber);
            url = (0, _SegmentsUtils.replaceTokenForTemplate)(url, 'Time', seg.replacementTime);
            seg.media = url;
        }

        var duration = representation.segmentDuration;
        var availabilityWindow = representation.segmentAvailabilityRange;
        if (isNaN(duration)) {
            representation.availableSegmentsNumber = 1;
        } else {
            representation.availableSegmentsNumber = Math.ceil((availabilityWindow.end - availabilityWindow.start) / duration);
        }

        return seg;
    }

    function getSegmentByTime(representation, requestedTime) {
        checkConfig();

        if (!representation) {
            return null;
        }

        var duration = representation.segmentDuration;

        if (isNaN(duration)) {
            return null;
        }

        var periodTime = timelineConverter.calcPeriodRelativeTimeFromMpdRelativeTime(representation, requestedTime);
        var index = Math.floor(periodTime / duration);

        return getSegmentByIndex(representation, index);
    }

    instance = {
        getSegmentByIndex: getSegmentByIndex,
        getSegmentByTime: getSegmentByTime
    };

    return instance;
}

TemplateSegmentsGetter.__dashjs_factory_name = 'TemplateSegmentsGetter';
var factory = _coreFactoryMaker2['default'].getClassFactory(TemplateSegmentsGetter);
exports['default'] = factory;
module.exports = exports['default'];

},{"11":11,"37":37,"65":65}],39:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _streamingConstantsConstants = _dereq_(65);

var _streamingConstantsConstants2 = _interopRequireDefault(_streamingConstantsConstants);

var _SegmentsUtils = _dereq_(37);

function TimelineSegmentsGetter(config, isDynamic) {

    config = config || {};
    var timelineConverter = config.timelineConverter;

    var instance = undefined;

    function checkConfig() {
        if (!timelineConverter || !timelineConverter.hasOwnProperty('calcMediaTimeFromPresentationTime') || !timelineConverter.hasOwnProperty('calcSegmentAvailabilityRange')) {
            throw new Error(_streamingConstantsConstants2['default'].MISSING_CONFIG_ERROR);
        }
    }

    function iterateSegments(representation, iterFunc) {
        var base = representation.adaptation.period.mpd.manifest.Period_asArray[representation.adaptation.period.index].AdaptationSet_asArray[representation.adaptation.index].Representation_asArray[representation.index].SegmentTemplate || representation.adaptation.period.mpd.manifest.Period_asArray[representation.adaptation.period.index].AdaptationSet_asArray[representation.adaptation.index].Representation_asArray[representation.index].SegmentList;
        var timeline = base.SegmentTimeline;
        var list = base.SegmentURL_asArray;

        var time = 0;
        var scaledTime = 0;
        var availabilityIdx = -1;

        var fragments = undefined,
            frag = undefined,
            i = undefined,
            len = undefined,
            j = undefined,
            repeat = undefined,
            repeatEndTime = undefined,
            nextFrag = undefined,
            fTimescale = undefined;

        fTimescale = representation.timescale;
        fragments = timeline.S_asArray;

        var breakIterator = false;

        for (i = 0, len = fragments.length; i < len && !breakIterator; i++) {
            frag = fragments[i];
            repeat = 0;
            if (frag.hasOwnProperty('r')) {
                repeat = frag.r;
            }

            // For a repeated S element, t belongs only to the first segment
            if (frag.hasOwnProperty('t')) {
                time = frag.t;
                scaledTime = time / fTimescale;
            }

            // This is a special case: "A negative value of the @r attribute of the S element indicates that the duration indicated in @d attribute repeats until the start of the next S element, the end of the Period or until the
            // next MPD update."
            if (repeat < 0) {
                nextFrag = fragments[i + 1];

                if (nextFrag && nextFrag.hasOwnProperty('t')) {
                    repeatEndTime = nextFrag.t / fTimescale;
                } else {
                    var availabilityEnd = representation.segmentAvailabilityRange ? representation.segmentAvailabilityRange.end : timelineConverter.calcSegmentAvailabilityRange(representation, isDynamic).end;
                    repeatEndTime = timelineConverter.calcMediaTimeFromPresentationTime(availabilityEnd, representation);
                    representation.segmentDuration = frag.d / fTimescale;
                }

                repeat = Math.ceil((repeatEndTime - scaledTime) / (frag.d / fTimescale)) - 1;
            }

            for (j = 0; j <= repeat && !breakIterator; j++) {
                availabilityIdx++;

                breakIterator = iterFunc(time, scaledTime, base, list, frag, fTimescale, availabilityIdx, i);

                if (breakIterator) {
                    representation.segmentDuration = frag.d / fTimescale;

                    // check if there is at least one more segment
                    if (j < repeat - 1 || i < len - 1) {
                        availabilityIdx++;
                    }
                }

                time += frag.d;
                scaledTime = time / fTimescale;
            }
        }

        representation.availableSegmentsNumber = availabilityIdx;
    }

    function getSegmentByIndex(representation, index, lastSegmentTime) {
        checkConfig();

        if (!representation) {
            return null;
        }

        var segment = null;
        var found = false;

        iterateSegments(representation, function (time, scaledTime, base, list, frag, fTimescale, availabilityIdx, i) {
            if (found || lastSegmentTime < 0) {
                var media = base.media;
                var mediaRange = frag.mediaRange;

                if (list) {
                    media = list[i].media || '';
                    mediaRange = list[i].mediaRange;
                }

                segment = (0, _SegmentsUtils.getTimeBasedSegment)(timelineConverter, isDynamic, representation, time, frag.d, fTimescale, media, mediaRange, availabilityIdx, frag.tManifest);

                return true;
            } else if (scaledTime >= lastSegmentTime - frag.d * 0.5 / fTimescale) {
                // same logic, if deviation is
                // 50% of segment duration, segment is found if scaledTime is greater than or equal to (startTime of previous segment - half of the previous segment duration)
                found = true;
            }

            return false;
        });

        return segment;
    }

    function getSegmentByTime(representation, requestedTime) {
        checkConfig();

        if (!representation) {
            return null;
        }

        if (requestedTime === undefined) {
            requestedTime = null;
        }

        var segment = null;
        var requiredMediaTime = timelineConverter.calcMediaTimeFromPresentationTime(requestedTime, representation);

        iterateSegments(representation, function (time, scaledTime, base, list, frag, fTimescale, availabilityIdx, i) {
            // In some cases when requiredMediaTime = actual end time of the last segment
            // it is possible that this time a bit exceeds the declared end time of the last segment.
            // in this case we still need to include the last segment in the segment list.
            if (requiredMediaTime < scaledTime + frag.d / fTimescale) {
                var media = base.media;
                var mediaRange = frag.mediaRange;

                if (list) {
                    media = list[i].media || '';
                    mediaRange = list[i].mediaRange;
                }

                segment = (0, _SegmentsUtils.getTimeBasedSegment)(timelineConverter, isDynamic, representation, time, frag.d, fTimescale, media, mediaRange, availabilityIdx, frag.tManifest);

                return true;
            }

            return false;
        });

        return segment;
    }

    instance = {
        getSegmentByIndex: getSegmentByIndex,
        getSegmentByTime: getSegmentByTime
    };

    return instance;
}

TimelineSegmentsGetter.__dashjs_factory_name = 'TimelineSegmentsGetter';
var factory = _coreFactoryMaker2['default'].getClassFactory(TimelineSegmentsGetter);
exports['default'] = factory;
module.exports = exports['default'];

},{"11":11,"37":37,"65":65}],40:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AdaptationSet = function AdaptationSet() {
  _classCallCheck(this, AdaptationSet);

  this.period = null;
  this.index = -1;
  this.type = null;
};

exports["default"] = AdaptationSet;
module.exports = exports["default"];

},{}],41:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var DEFAULT_DVB_PRIORITY = 1;
var DEFAULT_DVB_WEIGHT = 1;

var BaseURL = function BaseURL(url, serviceLocation, priority, weight) {
  _classCallCheck(this, BaseURL);

  this.url = url || '';
  this.serviceLocation = serviceLocation || url || '';

  // DVB extensions
  this.dvb_priority = priority || DEFAULT_DVB_PRIORITY;
  this.dvb_weight = weight || DEFAULT_DVB_WEIGHT;

  this.availabilityTimeOffset = 0;
  this.availabilityTimeComplete = true;

  /* currently unused:
   * byteRange,
   */
};

BaseURL.DEFAULT_DVB_PRIORITY = DEFAULT_DVB_PRIORITY;
BaseURL.DEFAULT_DVB_WEIGHT = DEFAULT_DVB_WEIGHT;

exports['default'] = BaseURL;
module.exports = exports['default'];

},{}],42:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Event = function Event() {
  _classCallCheck(this, Event);

  this.duration = NaN;
  this.presentationTime = NaN;
  this.id = NaN;
  this.messageData = '';
  this.eventStream = null;
  this.presentationTimeDelta = NaN; // Specific EMSG Box parameter
};

exports['default'] = Event;
module.exports = exports['default'];

},{}],43:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var EventStream = function EventStream() {
  _classCallCheck(this, EventStream);

  this.adaptionSet = null;
  this.representation = null;
  this.period = null;
  this.timescale = 1;
  this.value = '';
  this.schemeIdUri = '';
  this.presentationTimeOffset = 0;
};

exports['default'] = EventStream;
module.exports = exports['default'];

},{}],44:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Mpd = function Mpd() {
  _classCallCheck(this, Mpd);

  this.manifest = null;
  this.suggestedPresentationDelay = 0;
  this.availabilityStartTime = null;
  this.availabilityEndTime = Number.POSITIVE_INFINITY;
  this.timeShiftBufferDepth = Number.POSITIVE_INFINITY;
  this.maxSegmentDuration = Number.POSITIVE_INFINITY;
  this.publishTime = null;
  this.minimumUpdatePeriod = NaN;
  this.mediaPresentationDuration = NaN;
};

exports["default"] = Mpd;
module.exports = exports["default"];

},{}],45:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Period = function Period() {
  _classCallCheck(this, Period);

  this.id = null;
  this.index = -1;
  this.duration = NaN;
  this.start = NaN;
  this.mpd = null;
};

Period.DEFAULT_ID = 'defaultId';

exports['default'] = Period;
module.exports = exports['default'];

},{}],46:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _constantsDashConstants = _dereq_(20);

var _constantsDashConstants2 = _interopRequireDefault(_constantsDashConstants);

var Representation = (function () {
    function Representation() {
        _classCallCheck(this, Representation);

        this.id = null;
        this.index = -1;
        this.adaptation = null;
        this.segmentInfoType = null;
        this.initialization = null;
        this.codecs = null;
        this.codecPrivateData = null;
        this.segmentDuration = NaN;
        this.timescale = 1;
        this.startNumber = 1;
        this.indexRange = null;
        this.range = null;
        this.presentationTimeOffset = 0;
        // Set the source buffer timeOffset to this
        this.MSETimeOffset = NaN;
        this.segmentAvailabilityRange = null;
        this.availableSegmentsNumber = 0;
        this.bandwidth = NaN;
        this.width = NaN;
        this.height = NaN;
        this.scanType = null;
        this.maxPlayoutRate = NaN;
        this.availabilityTimeOffset = 0;
        this.availabilityTimeComplete = true;
    }

    _createClass(Representation, [{
        key: 'hasInitialization',
        value: function hasInitialization() {
            return this.initialization !== null || this.range !== null;
        }
    }, {
        key: 'hasSegments',
        value: function hasSegments() {
            return this.segmentInfoType !== _constantsDashConstants2['default'].BASE_URL && this.segmentInfoType !== _constantsDashConstants2['default'].SEGMENT_BASE && !this.indexRange;
        }
    }]);

    return Representation;
})();

exports['default'] = Representation;
module.exports = exports['default'];

},{"20":20}],47:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Segment = function Segment() {
  _classCallCheck(this, Segment);

  this.indexRange = null;
  this.index = null;
  this.mediaRange = null;
  this.media = null;
  this.duration = NaN;
  // this is the time that should be inserted into the media url
  this.replacementTime = null;
  // this is the number that should be inserted into the media url
  this.replacementNumber = NaN;
  // This is supposed to match the time encoded in the media Segment
  this.mediaStartTime = NaN;
  // When the source buffer timeOffset is set to MSETimeOffset this is the
  // time that will match the seekTarget and video.currentTime
  this.presentationStartTime = NaN;
  // Do not schedule this segment until
  this.availabilityStartTime = NaN;
  // Ignore and  discard this segment after
  this.availabilityEndTime = NaN;
  // The index of the segment inside the availability window
  this.availabilityIdx = NaN;
  // For dynamic mpd's, this is the wall clock time that the video
  // element currentTime should be presentationStartTime
  this.wallStartTime = NaN;
  this.representation = null;
};

exports["default"] = Segment;
module.exports = exports["default"];

},{}],48:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var UTCTiming = function UTCTiming() {
  _classCallCheck(this, UTCTiming);

  // UTCTiming is a DescriptorType and doesn't have any additional fields
  this.schemeIdUri = '';
  this.value = '';
};

exports['default'] = UTCTiming;
module.exports = exports['default'];

},{}],49:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _constantsOfflineConstants = _dereq_(52);

var _constantsOfflineConstants2 = _interopRequireDefault(_constantsOfflineConstants);

var _OfflineStream = _dereq_(50);

var _OfflineStream2 = _interopRequireDefault(_OfflineStream);

var _utilsOfflineIndexDBManifestParser = _dereq_(60);

var _utilsOfflineIndexDBManifestParser2 = _interopRequireDefault(_utilsOfflineIndexDBManifestParser);

var _errorsOfflineErrors = _dereq_(55);

var _errorsOfflineErrors2 = _interopRequireDefault(_errorsOfflineErrors);

var _dashParserDashParser = _dereq_(24);

var _dashParserDashParser2 = _interopRequireDefault(_dashParserDashParser);

function OfflineDownload(config) {
    config = config || {};

    var context = this.context;
    var manifestLoader = config.manifestLoader;
    var mediaPlayerModel = config.mediaPlayerModel;
    var abrController = config.abrController;
    var playbackController = config.playbackController;
    var adapter = config.adapter;
    var dashMetrics = config.dashMetrics;
    var timelineConverter = config.timelineConverter;
    var offlineStoreController = config.offlineStoreController;
    var manifestId = config.id;
    var eventBus = config.eventBus;
    var errHandler = config.errHandler;
    var events = config.events;
    var errors = config.errors;
    var settings = config.settings;
    var debug = config.debug;
    var manifestUpdater = config.manifestUpdater;
    var baseURLController = config.baseURLController;
    var constants = config.constants;
    var dashConstants = config.dashConstants;
    var urlUtils = config.urlUtils;

    var instance = undefined,
        logger = undefined,
        _manifestURL = undefined,
        _offlineURL = undefined,
        _xmlManifest = undefined,
        _streams = undefined,
        _manifest = undefined,
        _isDownloadingStatus = undefined,
        _isComposed = undefined,
        _representationsToUpdate = undefined,
        _indexDBManifestParser = undefined,
        _progressionById = undefined,
        _progression = undefined,
        _status = undefined;

    function setup() {
        logger = debug.getLogger(instance);
        manifestUpdater.initialize();
        _streams = [];
        _isDownloadingStatus = false;
        _isComposed = false;
        _progressionById = {};
        _progression = 0;
        _status = undefined;
    }

    function getId() {
        return manifestId;
    }

    function getOfflineUrl() {
        return _offlineURL;
    }

    function getManifestUrl() {
        return _manifestURL;
    }

    function getStatus() {
        return _status;
    }

    function setInitialState(state) {
        _offlineURL = state.url;
        _progression = state.progress;
        _manifestURL = state.originalUrl;
        _status = state.status;
    }

    /**
     * Download a stream, from url of manifest
     * @param {string} url
     * @instance
     */
    function downloadFromUrl(url) {
        _manifestURL = url;
        _offlineURL = _constantsOfflineConstants2['default'].OFFLINE_SCHEME + '://' + manifestId;
        _status = _constantsOfflineConstants2['default'].OFFLINE_STATUS_CREATED;
        setupOfflineEvents();
        var offlineManifest = {
            'fragmentStore': manifestId,
            'status': _status,
            'manifestId': manifestId,
            'url': _offlineURL,
            'originalURL': url
        };
        return createOfflineManifest(offlineManifest);
    }

    function initDownload() {
        manifestLoader.load(_manifestURL);
        _isDownloadingStatus = true;
    }

    function setupOfflineEvents() {
        eventBus.on(events.MANIFEST_UPDATED, onManifestUpdated, instance);
        eventBus.on(events.ORIGINAL_MANIFEST_LOADED, onOriginalManifestLoaded, instance);
        setupIndexedDBEvents();
    }

    function setupIndexedDBEvents() {
        eventBus.on(events.ERROR, onError, instance);
    }

    function isDownloading() {
        return _isDownloadingStatus;
    }

    function onManifestUpdated(e) {
        if (_isComposed) {
            return;
        }
        if (!e.error) {
            try {
                _manifest = e.manifest;
            } catch (err) {
                _status = _constantsOfflineConstants2['default'].OFFLINE_STATUS_ERROR;
                errHandler.error({
                    code: _errorsOfflineErrors2['default'].OFFLINE_ERROR,
                    message: err.message,
                    data: {
                        id: manifestId,
                        status: _status
                    }
                });
            }
        }
    }

    function onDownloadingStarted(e) {
        if (e.id !== manifestId) {
            return;
        }
        if (!e.error && manifestId !== null) {
            _status = _constantsOfflineConstants2['default'].OFFLINE_STATUS_STARTED;
            offlineStoreController.setDownloadingStatus(manifestId, _status).then(function () {
                eventBus.trigger(events.OFFLINE_RECORD_STARTED, { id: manifestId, message: 'Downloading started for this stream !' });
            });
        } else {
            _status = _constantsOfflineConstants2['default'].OFFLINE_STATUS_ERROR;
            errHandler.error({
                code: _errorsOfflineErrors2['default'].OFFLINE_ERROR,
                message: 'Cannot start download ',
                data: {
                    id: manifestId,
                    status: _status,
                    error: e.error
                }
            });
        }
    }

    function OnStreamProgression(stream, downloaded, available) {

        _progressionById[stream.getStreamInfo().id] = {
            downloaded: downloaded,
            available: available
        };

        var segments = 0;
        var allSegments = 0;
        var waitForAllProgress = undefined;
        for (var property in _progressionById) {
            if (_progressionById.hasOwnProperty(property)) {
                if (_progressionById[property] === null) {
                    waitForAllProgress = true;
                } else {
                    segments += _progressionById[property].downloaded;
                    allSegments += _progressionById[property].available;
                }
            }
        }

        if (!waitForAllProgress) {
            // all progression have been started, we can compute global progression
            _progression = segments / allSegments;

            // store progression
            offlineStoreController.getManifestById(manifestId).then(function (item) {
                item.progress = _progression;
                return updateOfflineManifest(item);
            });
        }
    }

    function onDownloadingFinished(e) {
        if (e.id !== manifestId) {
            return;
        }
        if (!e.error && manifestId !== null) {
            _status = _constantsOfflineConstants2['default'].OFFLINE_STATUS_FINISHED;
            offlineStoreController.setDownloadingStatus(manifestId, _status).then(function () {
                eventBus.trigger(events.OFFLINE_RECORD_FINISHED, { id: manifestId, message: 'Downloading has been successfully completed for this stream !' });
                resetDownload();
            });
        } else {
            _status = _constantsOfflineConstants2['default'].OFFLINE_STATUS_ERROR;
            errHandler.error({
                code: _errorsOfflineErrors2['default'].OFFLINE_ERROR,
                message: 'Error finishing download ',
                data: {
                    id: manifestId,
                    status: _status,
                    error: e.error
                }
            });
        }
    }

    function onManifestUpdateNeeded(e) {
        if (e.id !== manifestId) {
            return;
        }

        _representationsToUpdate = e.representations;

        if (_representationsToUpdate.length > 0) {
            _indexDBManifestParser.parse(_xmlManifest, _representationsToUpdate).then(function (parsedManifest) {
                if (parsedManifest !== null && manifestId !== null) {
                    offlineStoreController.getManifestById(manifestId).then(function (item) {
                        item.manifest = parsedManifest;
                        return updateOfflineManifest(item);
                    }).then(function () {
                        for (var i = 0, ln = _streams.length; i < ln; i++) {
                            _streams[i].startOfflineStreamProcessors();
                        }
                    });
                } else {
                    throw 'falling parsing offline manifest';
                }
            })['catch'](function (err) {
                throw err;
            });
        }
    }

    function composeStreams() {
        try {
            adapter.updatePeriods(_manifest);
            baseURLController.initialize(_manifest);
            var streamsInfo = adapter.getStreamsInfo();
            if (streamsInfo.length === 0) {
                _status = _constantsOfflineConstants2['default'].OFFLINE_STATUS_ERROR;
                errHandler.error({
                    code: _errorsOfflineErrors2['default'].OFFLINE_ERROR,
                    message: 'Cannot download - no streams',
                    data: {
                        id: manifestId,
                        status: _status
                    }
                });
            }
            for (var i = 0, ln = streamsInfo.length; i < ln; i++) {
                var streamInfo = streamsInfo[i];
                var stream = (0, _OfflineStream2['default'])(context).create({
                    id: manifestId,
                    callbacks: {
                        started: onDownloadingStarted,
                        progression: OnStreamProgression,
                        finished: onDownloadingFinished,
                        updateManifestNeeded: onManifestUpdateNeeded
                    },
                    constants: constants,
                    dashConstants: dashConstants,
                    eventBus: eventBus,
                    events: events,
                    errors: errors,
                    settings: settings,
                    debug: debug,
                    errHandler: errHandler,
                    mediaPlayerModel: mediaPlayerModel,
                    abrController: abrController,
                    playbackController: playbackController,
                    dashMetrics: dashMetrics,
                    baseURLController: baseURLController,
                    timelineConverter: timelineConverter,
                    adapter: adapter,
                    offlineStoreController: offlineStoreController
                });
                _streams.push(stream);

                // initialise stream and get downloadable representations
                stream.initialize(streamInfo);
                _progressionById[streamInfo.id] = null;
            }
            _isComposed = true;
        } catch (e) {
            logger.info(e);
            _status = _constantsOfflineConstants2['default'].OFFLINE_STATUS_ERROR;
            errHandler.error({
                code: _errorsOfflineErrors2['default'].OFFLINE_ERROR,
                message: e.message,
                data: {
                    id: manifestId,
                    status: _status,
                    error: e.error
                }
            });
        }
    }

    function getMediaInfos() {
        _streams.forEach(function (stream) {
            stream.getMediaInfos();
        });
    }

    /**
     * Init databsse to store fragments
     * @param {number} manifestId
     * @instance
     */
    function createFragmentStore(manifestId) {
        return offlineStoreController.createFragmentStore(manifestId);
    }

    /**
     * Store in database the string representation of offline manifest (with only downloaded representations)
     * @param {object} offlineManifest
     * @instance
     */
    function createOfflineManifest(offlineManifest) {
        return offlineStoreController.createOfflineManifest(offlineManifest);
    }

    /**
     * Store in database the string representation of offline manifest (with only downloaded representations)
     * @param {object} offlineManifest
     * @instance
     */
    function updateOfflineManifest(offlineManifest) {
        return offlineStoreController.updateOfflineManifest(offlineManifest);
    }

    /**
     * Triggered when manifest is loaded from internet.
     * @param {Object[]} e
     */
    function onOriginalManifestLoaded(e) {
        // unregister form event
        eventBus.off(events.ORIGINAL_MANIFEST_LOADED, onOriginalManifestLoaded, instance);

        _xmlManifest = e.originalManifest;

        if (_manifest.type === dashConstants.DYNAMIC) {
            _status = _constantsOfflineConstants2['default'].OFFLINE_STATUS_ERROR;
            errHandler.error({
                code: _errorsOfflineErrors2['default'].OFFLINE_ERROR,
                message: 'Cannot handle DYNAMIC manifest',
                data: {
                    id: manifestId,
                    status: _status
                }
            });
            logger.error('Cannot handle DYNAMIC manifest');

            return;
        }

        if (_manifest.Period_asArray.length > 1) {
            _status = _constantsOfflineConstants2['default'].OFFLINE_STATUS_ERROR;
            errHandler.error({
                code: _errorsOfflineErrors2['default'].OFFLINE_ERROR,
                message: 'MultiPeriod manifest are not yet supported',
                data: {
                    id: manifestId,
                    status: _status
                }
            });
            logger.error('MultiPeriod manifest are not yet supported');

            return;
        }

        // save original manifest (for resume)

        // initialise offline streams
        composeStreams(_manifest);

        // get MediaInfos
        getMediaInfos();

        eventBus.trigger(events.STREAMS_COMPOSED);
    }

    function initializeAllMediasInfoList(selectedRepresentations) {
        for (var i = 0; i < _streams.length; i++) {
            _streams[i].initializeAllMediasInfoList(selectedRepresentations);
        }
    }

    function getSelectedRepresentations(mediaInfos) {
        var rep = {};
        rep[constants.VIDEO] = [];
        rep[constants.AUDIO] = [];
        rep[constants.TEXT] = [];
        rep[constants.FRAGMENTED_TEXT] = [];

        // selectedRepresentations.video.forEach(item => {
        //     ret[constants.VIDEO].push(item.id);
        // });
        // selectedRepresentations.audio.forEach(item => {
        //     ret[constants.AUDIO].push(item.id);
        // });
        // selectedRepresentations.text.forEach(item => {
        //     ret[item.type].push(item.id);
        // });

        mediaInfos.forEach(function (mediaInfo) {
            mediaInfo.bitrateList.forEach(function (bitrate) {
                rep[mediaInfo.type].push(bitrate.id);
            });
        });
        return rep;
    }

    function startDownload(mediaInfos) {
        try {
            (function () {
                var rep = getSelectedRepresentations(mediaInfos);

                offlineStoreController.saveSelectedRepresentations(manifestId, rep).then(function () {
                    return createFragmentStore(manifestId);
                }).then(function () {
                    return generateOfflineManifest(rep);
                }).then(function () {
                    initializeAllMediasInfoList(rep);
                });
            })();
        } catch (err) {
            _status = _constantsOfflineConstants2['default'].OFFLINE_STATUS_ERROR;
            errHandler.error({
                code: _errorsOfflineErrors2['default'].OFFLINE_ERROR,
                message: err.message,
                data: {
                    id: manifestId,
                    status: _status
                }
            });
        }
    }

    /**
     * Create the parser used to convert original manifest in offline manifest
     * Creates a JSON object that will be stored in database
     * @param {Object[]} selectedRepresentations
     * @instance
     */
    function generateOfflineManifest(selectedRepresentations) {
        _indexDBManifestParser = (0, _utilsOfflineIndexDBManifestParser2['default'])(context).create({
            manifestId: manifestId,
            allMediaInfos: selectedRepresentations,
            debug: debug,
            dashConstants: dashConstants,
            constants: constants,
            urlUtils: urlUtils
        });

        return _indexDBManifestParser.parse(_xmlManifest).then(function (parsedManifest) {
            if (parsedManifest !== null) {
                return offlineStoreController.getManifestById(manifestId).then(function (item) {
                    item.originalURL = _manifest.url;
                    item.originalManifest = _xmlManifest;
                    item.manifest = parsedManifest;
                    return updateOfflineManifest(item);
                });
            } else {
                return Promise.reject('falling parsing offline manifest');
            }
        })['catch'](function (err) {
            return Promise.reject(err);
        });
    }

    /**
     * Stops downloading of fragments
     * @instance
     */
    function stopDownload() {
        if (manifestId !== null && isDownloading()) {
            for (var i = 0, ln = _streams.length; i < ln; i++) {
                _streams[i].stopOfflineStreamProcessors();
            }

            // remove streams
            _streams = [];

            _isComposed = false;

            _status = _constantsOfflineConstants2['default'].OFFLINE_STATUS_STOPPED;
            // update status
            offlineStoreController.setDownloadingStatus(manifestId, _status).then(function () {
                eventBus.trigger(events.OFFLINE_RECORD_STOPPED, {
                    sender: this,
                    id: manifestId,
                    status: _status,
                    message: 'Downloading has been stopped for this stream !'
                });
                _isDownloadingStatus = false;
            });
        }
    }

    /**
     * Delete an offline manifest (and all of its data)
     * @instance
     */
    function deleteDownload() {
        stopDownload();
    }

    /**
     * Resume download of a stream
     * @instance
     */
    function resumeDownload() {
        if (isDownloading()) {
            return;
        }

        _isDownloadingStatus = true;

        var selectedRepresentations = undefined;

        offlineStoreController.getManifestById(manifestId).then(function (item) {
            var parser = (0, _dashParserDashParser2['default'])(context).create({ debug: debug });
            _manifest = parser.parse(item.originalManifest);

            composeStreams(_manifest);

            selectedRepresentations = item.selected;

            eventBus.trigger(events.STREAMS_COMPOSED);

            return createFragmentStore(manifestId);
        }).then(function () {
            initializeAllMediasInfoList(selectedRepresentations);
        });
    }

    /**
     * Compute the progression of download
     * @instance
     */
    function getDownloadProgression() {
        return Math.round(_progression * 100);
    }

    /**
     * Reset events listeners
     * @instance
     */
    function resetDownload() {
        for (var i = 0, ln = _streams.length; i < ln; i++) {
            _streams[i].reset();
        }
        _indexDBManifestParser = null;
        _isDownloadingStatus = false;
        _streams = [];
        eventBus.off(events.MANIFEST_UPDATED, onManifestUpdated, instance);
        eventBus.off(events.ORIGINAL_MANIFEST_LOADED, onOriginalManifestLoaded, instance);
        resetIndexedDBEvents();
    }

    function onError(e) {
        if (e.error.code === _errorsOfflineErrors2['default'].INDEXEDDB_QUOTA_EXCEED_ERROR || e.error.code === _errorsOfflineErrors2['default'].INDEXEDDB_INVALID_STATE_ERROR) {
            stopDownload();
        }
    }

    function resetIndexedDBEvents() {
        eventBus.on(events.ERROR, onError, instance);
    }

    /**
     * Reset
     * @instance
     */
    function reset() {
        if (isDownloading()) {
            resetDownload();
        }
        baseURLController.reset();
        manifestUpdater.reset();
    }

    instance = {
        reset: reset,
        getId: getId,
        getOfflineUrl: getOfflineUrl,
        getManifestUrl: getManifestUrl,
        getStatus: getStatus,
        setInitialState: setInitialState,
        initDownload: initDownload,
        downloadFromUrl: downloadFromUrl,
        startDownload: startDownload,
        stopDownload: stopDownload,
        resumeDownload: resumeDownload,
        deleteDownload: deleteDownload,
        getDownloadProgression: getDownloadProgression,
        isDownloading: isDownloading,
        resetDownload: resetDownload
    };

    setup();

    return instance;
}

OfflineDownload.__dashjs_factory_name = 'OfflineDownload';
exports['default'] = dashjs.FactoryMaker.getClassFactory(OfflineDownload);
/* jshint ignore:line */
module.exports = exports['default'];

},{"24":24,"50":50,"52":52,"55":55,"60":60}],50:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _OfflineStreamProcessor = _dereq_(51);

var _OfflineStreamProcessor2 = _interopRequireDefault(_OfflineStreamProcessor);

/**
 * Initialize and Manage Offline Stream for each type
 */
/**
 * @class OfflineStream
 * @description Initialize and Manage Offline Stream for each type
 * @param {Object} config - dependences
 * @ignore
 */
function OfflineStream(config) {

    config = config || {};
    var context = this.context;
    var eventBus = config.eventBus;
    var events = config.events;
    var errors = config.errors;
    var constants = config.constants;
    var dashConstants = config.dashConstants;
    var settings = config.settings;
    var debug = config.debug;
    var errHandler = config.errHandler;
    var mediaPlayerModel = config.mediaPlayerModel;
    var abrController = config.abrController;
    var playbackController = config.playbackController;
    var adapter = config.adapter;
    var dashMetrics = config.dashMetrics;
    var baseURLController = config.baseURLController;
    var timelineConverter = config.timelineConverter;
    var offlineStoreController = config.offlineStoreController;
    var manifestId = config.id;
    var startedCb = config.callbacks && config.callbacks.started;
    var progressionCb = config.callbacks && config.callbacks.progression;
    var finishedCb = config.callbacks && config.callbacks.finished;
    var updateManifest = config.callbacks && config.callbacks.updateManifestNeeded;

    var instance = undefined,
        offlineStreamProcessors = undefined,
        startedOfflineStreamProcessors = undefined,
        finishedOfflineStreamProcessors = undefined,
        streamInfo = undefined,
        representationsToUpdate = undefined,
        allMediasInfosList = undefined,
        progressionById = undefined;

    function setup() {
        resetInitialSettings();
    }

    /**
     * Reset
     */
    function resetInitialSettings() {
        streamInfo = null;
        offlineStreamProcessors = [];
        startedOfflineStreamProcessors = 0;
        finishedOfflineStreamProcessors = 0;
        allMediasInfosList = [];
        representationsToUpdate = [];
        progressionById = {};
    }

    /**
     * Initialize offlinestream
     * @param {Object} initStreamInfo
     */
    function initialize(initStreamInfo) {
        streamInfo = initStreamInfo;
        eventBus.on(events.DATA_UPDATE_COMPLETED, onDataUpdateCompleted, instance);
    }

    function getStreamId() {
        return streamInfo.id;
    }

    /**
     * Creates media infos list, so that user will be able to choose the representation he wants to download
     */
    function getMediaInfos() {
        var mediaInfos = adapter.getAllMediaInfoForType(streamInfo, constants.VIDEO);
        mediaInfos = mediaInfos.concat(adapter.getAllMediaInfoForType(streamInfo, constants.AUDIO));
        mediaInfos = mediaInfos.concat(adapter.getAllMediaInfoForType(streamInfo, constants.FRAGMENTED_TEXT));
        mediaInfos = mediaInfos.concat(adapter.getAllMediaInfoForType(streamInfo, constants.TEXT));

        // mediaInfos = mediaInfos.concat(adapter.getAllMediaInfoForType(streamInfo, constants.MUXED));
        // mediaInfos = mediaInfos.concat(adapter.getAllMediaInfoForType(streamInfo, constants.IMAGE));

        eventBus.trigger(events.OFFLINE_RECORD_LOADEDMETADATA, {
            id: manifestId,
            mediaInfos: mediaInfos
        });
    }

    /**
     * Initialize with choosen representations by user
     * @param {Object} mediasInfoList
     */
    function initializeAllMediasInfoList(mediasInfoList) {
        allMediasInfosList = mediasInfoList;
        initializeMedia(streamInfo);
    }

    /**
     * Initialize media for each type
     * @param {Object} streamInfo
     */
    function initializeMedia(streamInfo) {
        createOfflineStreamProcessorFor(constants.VIDEO, streamInfo);
        createOfflineStreamProcessorFor(constants.AUDIO, streamInfo);
        createOfflineStreamProcessorFor(constants.FRAGMENTED_TEXT, streamInfo);
        createOfflineStreamProcessorFor(constants.TEXT, streamInfo);

        createOfflineStreamProcessorFor(constants.MUXED, streamInfo);
        createOfflineStreamProcessorFor(constants.IMAGE, streamInfo);
    }

    function createOfflineStreamProcessorFor(type, streamInfo) {
        // filter mediaInfo according to choosen representation id
        var allMediaInfoForType = adapter.getAllMediaInfoForType(streamInfo, type);
        allMediaInfoForType.forEach(function (media) {
            media.bitrateList = media.bitrateList.filter(function (bitrate) {
                if (allMediasInfosList[type] && allMediasInfosList[type].indexOf(bitrate.id) !== -1) {
                    return true;
                }
                return false;
            });
        });

        allMediaInfoForType = allMediaInfoForType.filter(function (media) {
            return media.bitrateList && media.bitrateList.length > 0;
        });

        // cration of an offline stream processor for each choosen representation
        allMediaInfoForType.forEach(function (mediaInfo) {
            if (mediaInfo.bitrateList) {
                mediaInfo.bitrateList.forEach(function (bitrate) {
                    createStreamProcessor(mediaInfo, bitrate);
                });
            }
        });
        return allMediaInfoForType;
    }

    function createStreamProcessor(mediaInfo, bitrate) {

        var streamProcessor = (0, _OfflineStreamProcessor2['default'])(context).create({
            id: manifestId,
            streamInfo: streamInfo,
            debug: debug,
            events: events,
            errors: errors,
            eventBus: eventBus,
            constants: constants,
            dashConstants: dashConstants,
            settings: settings,
            type: mediaInfo.type,
            mimeType: mediaInfo.mimeType,
            bitrate: bitrate,
            errHandler: errHandler,
            mediaPlayerModel: mediaPlayerModel,
            abrController: abrController,
            playbackController: playbackController,
            adapter: adapter,
            dashMetrics: dashMetrics,
            baseURLController: baseURLController,
            timelineConverter: timelineConverter,
            offlineStoreController: offlineStoreController,
            callbacks: {
                completed: onStreamCompleted,
                progression: onStreamProgression
            }
        });
        offlineStreamProcessors.push(streamProcessor);
        streamProcessor.initialize(mediaInfo);

        progressionById[bitrate.id] = null;
    }

    function onStreamCompleted() {
        finishedOfflineStreamProcessors++;
        if (finishedOfflineStreamProcessors === offlineStreamProcessors.length) {
            finishedCb({ sender: this, id: manifestId, message: 'Downloading has been successfully completed for this stream !' });
        }
    }

    function onStreamProgression(streamProcessor, downloadedSegments, availableSegments) {
        progressionById[streamProcessor.getRepresentationId()] = {
            downloadedSegments: downloadedSegments,
            availableSegments: availableSegments
        };

        var segments = 0;
        var allSegments = 0;
        var waitForAllProgress = undefined;
        for (var property in progressionById) {
            if (progressionById.hasOwnProperty(property)) {
                if (progressionById[property] === null) {
                    waitForAllProgress = true;
                } else {
                    segments += progressionById[property].downloadedSegments;
                    allSegments += progressionById[property].availableSegments;
                }
            }
        }

        if (!waitForAllProgress && progressionCb) {
            // all progression have been started, we can compute global progression
            if (allSegments > 0) {
                progressionCb(instance, segments, allSegments);
            }
        }
    }

    function onDataUpdateCompleted(e) {
        if (e.currentRepresentation.segments && e.currentRepresentation.segments.length > 0) {
            representationsToUpdate.push(e.currentRepresentation);
        }

        var sp = undefined;
        // data are ready fr stream processor, let's start download
        for (var i = 0; i < offlineStreamProcessors.length; i++) {
            if (offlineStreamProcessors[i].getRepresentationController().getType() === e.mediaType) {
                sp = offlineStreamProcessors[i];
                break;
            }
        }

        if (sp) {
            checkIfAllOfflineStreamProcessorsStarted();
        }
    }

    function checkIfAllOfflineStreamProcessorsStarted() {
        startedOfflineStreamProcessors++;
        if (startedOfflineStreamProcessors === offlineStreamProcessors.length) {
            startedCb({ sender: this, id: manifestId, message: 'Downloading started for this stream !' });

            if (representationsToUpdate.length > 0) {
                updateManifest({ sender: this, id: manifestId, representations: representationsToUpdate });
            } else {
                startOfflineStreamProcessors();
            }
        }
    }

    function getStreamInfo() {
        return streamInfo;
    }

    function getStartTime() {
        return streamInfo ? streamInfo.start : NaN;
    }

    function getDuration() {
        return streamInfo ? streamInfo.duration : NaN;
    }

    /**
     * Stop offline stream processors
     */
    function stopOfflineStreamProcessors() {
        for (var i = 0; i < offlineStreamProcessors.length; i++) {
            offlineStreamProcessors[i].stop();
        }
    }

    /**
     * Start offline stream processors
     */
    function startOfflineStreamProcessors() {
        for (var i = 0; i < offlineStreamProcessors.length; i++) {
            offlineStreamProcessors[i].start();
        }
    }

    function deactivate() {
        var ln = offlineStreamProcessors ? offlineStreamProcessors.length : 0;
        for (var i = 0; i < ln; i++) {
            offlineStreamProcessors[i].removeExecutedRequestsBeforeTime(getStartTime() + getDuration());
            offlineStreamProcessors[i].reset();
        }
    }

    /**
     * Reset
     */
    function reset() {
        stopOfflineStreamProcessors();
        deactivate();
        resetInitialSettings();

        eventBus.off(events.DATA_UPDATE_COMPLETED, onDataUpdateCompleted, instance);
    }

    instance = {
        initialize: initialize,
        getStreamId: getStreamId,
        getMediaInfos: getMediaInfos,
        initializeAllMediasInfoList: initializeAllMediasInfoList,
        getStreamInfo: getStreamInfo,
        stopOfflineStreamProcessors: stopOfflineStreamProcessors,
        startOfflineStreamProcessors: startOfflineStreamProcessors,
        reset: reset
    };

    setup();
    return instance;
}

OfflineStream.__dashjs_factory_name = 'OfflineStream';
exports['default'] = dashjs.FactoryMaker.getClassFactory(OfflineStream);
/* jshint ignore:line */
module.exports = exports['default'];

},{"51":51}],51:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _dashDashHandler = _dereq_(19);

var _dashDashHandler2 = _interopRequireDefault(_dashDashHandler);

var _dashControllersRepresentationController = _dereq_(21);

var _dashControllersRepresentationController2 = _interopRequireDefault(_dashControllersRepresentationController);

var _streamingModelsFragmentModel = _dereq_(68);

var _streamingModelsFragmentModel2 = _interopRequireDefault(_streamingModelsFragmentModel);

var _streamingFragmentLoader = _dereq_(63);

var _streamingFragmentLoader2 = _interopRequireDefault(_streamingFragmentLoader);

var _streamingUtilsURLUtils = _dereq_(80);

var _streamingUtilsURLUtils2 = _interopRequireDefault(_streamingUtilsURLUtils);

var _streamingUtilsRequestModifier = _dereq_(79);

var _streamingUtilsRequestModifier2 = _interopRequireDefault(_streamingUtilsRequestModifier);

function OfflineStreamProcessor(config) {

    config = config || {};
    var context = this.context;
    var eventBus = config.eventBus;
    var events = config.events;
    var errors = config.errors;
    var debug = config.debug;
    var constants = config.constants;
    var settings = config.settings;
    var dashConstants = config.dashConstants;
    var manifestId = config.id;
    var type = config.type;
    var streamInfo = config.streamInfo;
    var errHandler = config.errHandler;
    var mediaPlayerModel = config.mediaPlayerModel;
    var abrController = config.abrController;
    var playbackController = config.playbackController;
    var adapter = config.adapter;
    var dashMetrics = config.dashMetrics;
    var baseURLController = config.baseURLController;
    var timelineConverter = config.timelineConverter;
    var bitrate = config.bitrate;
    var offlineStoreController = config.offlineStoreController;
    var completedCb = config.callbacks && config.callbacks.completed;
    var progressCb = config.callbacks && config.callbacks.progression;

    var instance = undefined,
        logger = undefined,
        mediaInfo = undefined,
        indexHandler = undefined,
        representationController = undefined,
        fragmentModel = undefined,
        updating = undefined,
        downloadedSegments = undefined,
        isInitialized = undefined,
        isStopped = undefined;

    function setup() {
        resetInitialSettings();
        logger = debug.getLogger(instance);

        indexHandler = (0, _dashDashHandler2['default'])(context).create({
            streamInfo: streamInfo,
            type: type,
            timelineConverter: timelineConverter,
            dashMetrics: dashMetrics,
            mediaPlayerModel: mediaPlayerModel,
            baseURLController: baseURLController,
            errHandler: errHandler,
            settings: settings,
            // boxParser: boxParser,
            eventBus: eventBus,
            events: events,
            debug: debug,
            requestModifier: (0, _streamingUtilsRequestModifier2['default'])(context).getInstance(),
            dashConstants: dashConstants,
            constants: constants,
            urlUtils: (0, _streamingUtilsURLUtils2['default'])(context).getInstance()
        });

        representationController = (0, _dashControllersRepresentationController2['default'])(context).create({
            streamInfo: streamInfo,
            type: type,
            abrController: abrController,
            dashMetrics: dashMetrics,
            playbackController: playbackController,
            timelineConverter: timelineConverter,
            dashConstants: dashConstants,
            events: events,
            eventBus: eventBus,
            errors: errors
        });

        fragmentModel = (0, _streamingModelsFragmentModel2['default'])(context).create({
            streamInfo: streamInfo,
            dashMetrics: dashMetrics,
            fragmentLoader: (0, _streamingFragmentLoader2['default'])(context).create({
                dashMetrics: dashMetrics,
                mediaPlayerModel: mediaPlayerModel,
                errHandler: errHandler,
                requestModifier: (0, _streamingUtilsRequestModifier2['default'])(context).getInstance(),
                settings: settings,
                eventBus: eventBus,
                events: events,
                errors: errors,
                constants: constants,
                dashConstants: dashConstants,
                urlUtils: (0, _streamingUtilsURLUtils2['default'])(context).getInstance()
            }),
            debug: debug,
            eventBus: eventBus,
            events: events
        });

        eventBus.on(events.STREAM_COMPLETED, onStreamCompleted, instance);
        eventBus.on(events.FRAGMENT_LOADING_COMPLETED, onFragmentLoadingCompleted, instance);
    }

    function initialize(_mediaInfo) {
        mediaInfo = _mediaInfo;
        indexHandler.initialize(false);
        updateRepresentation(mediaInfo);
    }

    function isInitRequest(request) {
        return request.type === 'InitializationSegment';
    }

    function onFragmentLoadingCompleted(e) {
        if (e.sender !== fragmentModel) {
            return;
        }

        if (e.request !== null) {
            (function () {
                var isInit = isInitRequest(e.request);
                var suffix = isInit ? 'init' : e.request.index;
                var fragmentName = e.request.representationId + '_' + suffix;
                offlineStoreController.storeFragment(manifestId, fragmentName, e.response).then(function () {
                    if (!isInit) {
                        // store current index and downloadedSegments number
                        offlineStoreController.setRepresentationCurrentState(manifestId, e.request.representationId, {
                            index: e.request.index,
                            downloaded: downloadedSegments
                        });
                    }
                });
            })();
        }

        if (e.error && e.request.serviceLocation && !isStopped) {
            fragmentModel.executeRequest(e.request);
        } else {
            downloadedSegments++;
            download();
        }
    }

    function onStreamCompleted(e) {
        if (e.fragmentModel !== fragmentModel) {
            return;
        }
        logger.info('[' + manifestId + '] Stream is complete');
        stop();
        completedCb();
    }

    function getRepresentationController() {
        return representationController;
    }

    function getRepresentationId() {
        return representationController.getCurrentRepresentation().id;
    }

    /**
     * Stops download of fragments
     * @memberof OfflineStreamProcessor#
     */
    function stop() {
        if (isStopped) {
            return;
        }
        isStopped = true;
    }

    function removeExecutedRequestsBeforeTime(time) {
        if (fragmentModel) {
            fragmentModel.removeExecutedRequestsBeforeTime(time);
        }
    }

    /**
     * Execute init request for the represenation
     * @memberof OfflineStreamProcessor#
    */
    function getInitRequest() {
        if (!representationController.getCurrentRepresentation()) {
            return null;
        }

        return indexHandler.getInitRequest(getMediaInfo(), representationController.getCurrentRepresentation());
    }

    /**
     * Get next request
     * @memberof OfflineStreamProcessor#
    */
    function getNextRequest() {
        return indexHandler.getNextSegmentRequest(getMediaInfo(), representationController.getCurrentRepresentation());
    }

    /**
     * Start download
     * @memberof OfflineStreamProcessor#
    */
    function start() {
        if (representationController) {
            if (!representationController.getCurrentRepresentation()) {
                throw new Error('Start denied to OfflineStreamProcessor');
            }
            isStopped = false;

            offlineStoreController.getRepresentationCurrentState(manifestId, representationController.getCurrentRepresentation().id).then(function (state) {
                if (state) {
                    indexHandler.setCurrentIndex(state.index);
                    downloadedSegments = state.downloaded;
                }
                download();
            })['catch'](function () {
                // start from beginining
                download();
            });
        }
    }

    /**
     * Performs download of fragment according to type
     * @memberof OfflineStreamProcessor#
    */
    function download() {
        if (isStopped) {
            return;
        }

        if (isNaN(representationController.getCurrentRepresentation())) {
            var request = null;
            if (!isInitialized) {
                request = getInitRequest();
                isInitialized = true;
            } else {
                request = getNextRequest();

                // update progression : done here because availableSegmentsNumber is done in getNextRequest from dash handler
                updateProgression();
            }

            if (request) {
                logger.info('[' + manifestId + '] download request : ' + request.url);
                fragmentModel.executeRequest(request);
            } else {
                logger.info('[' + manifestId + '] no request to be downloaded');
            }
        }
    }

    /**
     * Update representation
     * @param {Object} mediaInfo - mediaInfo
     * @memberof OfflineStreamProcessor#
     */
    function updateRepresentation(mediaInfo) {
        updating = true;

        var voRepresentations = adapter.getVoRepresentations(mediaInfo);

        // get representation VO according to id.
        var quality = voRepresentations.findIndex(function (representation) {
            return representation.id === bitrate.id;
        });

        if (type !== constants.VIDEO && type !== constants.AUDIO && type !== constants.TEXT && type !== constants.FRAGMENTED_TEXT) {
            updating = false;
            return;
        }

        representationController.updateData(null, voRepresentations, type, quality);
    }

    function isUpdating() {
        return updating;
    }

    function getType() {
        return type;
    }

    function getMediaInfo() {
        return mediaInfo;
    }

    function getAvailableSegmentsNumber() {
        return representationController.getCurrentRepresentation().availableSegmentsNumber + 1; // do not forget init segment
    }

    function updateProgression() {
        if (progressCb) {
            progressCb(instance, downloadedSegments, getAvailableSegmentsNumber());
        }
    }

    function resetInitialSettings() {
        isInitialized = false;
        downloadedSegments = 0;
        updating = false;
    }

    /**
     * Reset
     * @memberof OfflineStreamProcessor#
    */
    function reset() {
        resetInitialSettings();
        indexHandler.reset();

        eventBus.off(events.STREAM_COMPLETED, onStreamCompleted, instance);
        eventBus.off(events.FRAGMENT_LOADING_COMPLETED, onFragmentLoadingCompleted, instance);
    }

    instance = {
        initialize: initialize,
        getMediaInfo: getMediaInfo,
        getRepresentationController: getRepresentationController,
        removeExecutedRequestsBeforeTime: removeExecutedRequestsBeforeTime,
        getType: getType,
        getRepresentationId: getRepresentationId,
        isUpdating: isUpdating,
        start: start,
        stop: stop,
        getAvailableSegmentsNumber: getAvailableSegmentsNumber,
        reset: reset
    };

    setup();

    return instance;
}
OfflineStreamProcessor.__dashjs_factory_name = 'OfflineStreamProcessor';
var factory = dashjs.FactoryMaker.getClassFactory(OfflineStreamProcessor); /* jshint ignore:line */
exports['default'] = factory;
module.exports = exports['default'];

},{"19":19,"21":21,"63":63,"68":68,"79":79,"80":80}],52:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Offline constants declaration
 * @class
 * @ignore
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var OfflineConstants = (function () {
  _createClass(OfflineConstants, [{
    key: 'init',
    value: function init() {
      this.OFFLINE_SCHEME = 'offline_indexeddb';
      this.OFFLINE_URL_REGEX = /^offline_indexeddb:\/\//i;
      this.OFFLINE_STATUS_CREATED = 'created';
      this.OFFLINE_STATUS_STARTED = 'started';
      this.OFFLINE_STATUS_STOPPED = 'stopped';
      this.OFFLINE_STATUS_FINISHED = 'finished';
      this.OFFLINE_STATUS_ERROR = 'error';
    }
  }]);

  function OfflineConstants() {
    _classCallCheck(this, OfflineConstants);

    this.init();
  }

  return OfflineConstants;
})();

var constants = new OfflineConstants();
exports['default'] = constants;
module.exports = exports['default'];

},{}],53:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _constantsOfflineConstants = _dereq_(52);

var _constantsOfflineConstants2 = _interopRequireDefault(_constantsOfflineConstants);

var _OfflineStoreController = _dereq_(54);

var _OfflineStoreController2 = _interopRequireDefault(_OfflineStoreController);

var _OfflineDownload = _dereq_(49);

var _OfflineDownload2 = _interopRequireDefault(_OfflineDownload);

var _netIndexDBOfflineLoader = _dereq_(58);

var _netIndexDBOfflineLoader2 = _interopRequireDefault(_netIndexDBOfflineLoader);

var _utilsOfflineUrlUtils = _dereq_(61);

var _utilsOfflineUrlUtils2 = _interopRequireDefault(_utilsOfflineUrlUtils);

var _eventsOfflineEvents = _dereq_(56);

var _eventsOfflineEvents2 = _interopRequireDefault(_eventsOfflineEvents);

var _errorsOfflineErrors = _dereq_(55);

var _errorsOfflineErrors2 = _interopRequireDefault(_errorsOfflineErrors);

var _voOfflineDownloadVo = _dereq_(62);

var _voOfflineDownloadVo2 = _interopRequireDefault(_voOfflineDownloadVo);

/**
 * @module OfflineController
 * @param {Object} config - dependencies
 * @description Provides access to offline stream recording and playback functionality.
 */
function OfflineController(config) {

    var context = this.context;
    var errHandler = config.errHandler;
    var events = config.events;
    var errors = config.errors;
    var settings = config.settings;
    var eventBus = config.eventBus;
    var debug = config.debug;
    var manifestLoader = config.manifestLoader;
    var manifestModel = config.manifestModel;
    var mediaPlayerModel = config.mediaPlayerModel;
    var abrController = config.abrController;
    var playbackController = config.playbackController;
    var dashMetrics = config.dashMetrics;
    var timelineConverter = config.timelineConverter;
    var adapter = config.adapter;
    var manifestUpdater = config.manifestUpdater;
    var baseURLController = config.baseURLController;
    var schemeLoaderFactory = config.schemeLoaderFactory;
    var constants = config.constants;
    var dashConstants = config.dashConstants;
    var urlUtils = config.urlUtils;

    var instance = undefined,
        downloads = undefined,
        logger = undefined,
        offlineStoreController = undefined,
        offlineUrlUtils = undefined;

    function setup() {
        logger = debug.getLogger(instance);
        offlineStoreController = (0, _OfflineStoreController2['default'])(context).create({
            eventBus: config.eventBus,
            errHandler: errHandler
        });
        offlineUrlUtils = (0, _utilsOfflineUrlUtils2['default'])(context).getInstance();
        urlUtils.registerUrlRegex(offlineUrlUtils.getRegex(), offlineUrlUtils);
        schemeLoaderFactory.registerLoader(_constantsOfflineConstants2['default'].OFFLINE_SCHEME, _netIndexDBOfflineLoader2['default']);

        downloads = [];
    }

    /*
    ---------------------------------------------------------------------------
        DOWNLOAD LIST FUNCTIONS
    ---------------------------------------------------------------------------
    */
    function getDownloadFromId(id) {
        var download = downloads.find(function (item) {
            return item.getId() === id;
        });
        return download;
    }

    function createDownloadFromId(id) {
        var download = undefined;
        download = getDownloadFromId(id);

        if (!download) {
            // create download controller
            download = (0, _OfflineDownload2['default'])(context).create({
                id: id,
                eventBus: eventBus,
                events: events,
                errors: errors,
                settings: settings,
                manifestLoader: manifestLoader,
                manifestModel: manifestModel,
                mediaPlayerModel: mediaPlayerModel,
                manifestUpdater: manifestUpdater,
                baseURLController: baseURLController,
                abrController: abrController,
                playbackController: playbackController,
                adapter: adapter,
                dashMetrics: dashMetrics,
                timelineConverter: timelineConverter,
                errHandler: errHandler,
                offlineStoreController: offlineStoreController,
                debug: debug,
                constants: constants,
                dashConstants: dashConstants,
                urlUtils: urlUtils
            });

            downloads.push(download);
        }

        return download;
    }

    function createDownloadFromStorage(offline) {
        var download = getDownloadFromId(offline.manifestId);

        if (!download) {
            download = createDownloadFromId(offline.manifestId);
            var _status = offline.status;
            if (_status === _constantsOfflineConstants2['default'].OFFLINE_STATUS_STARTED) {
                _status = _constantsOfflineConstants2['default'].OFFLINE_STATUS_STOPPED;
            }

            download.setInitialState({
                url: offline.url,
                progress: offline.progress,
                originalUrl: offline.originalURL,
                status: _status
            });
        }

        return download;
    }

    function removeDownloadFromId(id) {
        return new Promise(function (resolve, reject) {
            var download = getDownloadFromId(id);
            var waitForStatusChanged = false;
            if (download) {
                //is download running?
                if (download.isDownloading()) {
                    (function () {
                        //register status changed event
                        waitForStatusChanged = true;
                        var downloadStopped = function downloadStopped() {
                            eventBus.off(events.OFFLINE_RECORD_STOPPED, downloadStopped, instance);
                            return offlineStoreController.deleteDownloadById(id).then(function () {
                                resolve();
                            })['catch'](function (err) {
                                reject(err);
                            });
                        };
                        eventBus.on(events.OFFLINE_RECORD_STOPPED, downloadStopped, instance);
                    })();
                }
                download.deleteDownload();
                var index = downloads.indexOf(download);
                downloads.splice(index, 1);
            }

            if (!waitForStatusChanged) {
                resolve();
            }
        });
    }

    function generateManifestId() {
        var timestamp = new Date().getTime();
        return timestamp;
    }

    /*
    ---------------------------------------------------------------------------
         OFFLINE CONTROLLER API
     ---------------------------------------------------------------------------
    */

    /**
     * Loads records from storage
     * This methods has to be called first, to be sure that all downloads have been loaded
     *
     * @return {Promise} asynchronously resolved
     * @memberof module:OfflineController
     */
    function loadRecordsFromStorage() {
        return new Promise(function (resolve, reject) {
            offlineStoreController.getAllManifests().then(function (items) {
                items.manifests.forEach(function (offline) {
                    createDownloadFromStorage(offline);
                });

                resolve();
            })['catch'](function (e) {
                logger.error('Failed to load downloads ' + e);
                reject(e);
            });
        });
    }

    /**
     * Get all records from storage
     *
     * @return {Promise} asynchronously resolved with records
     * @memberof module:OfflineController
     * @instance
     */
    function getAllRecords() {
        var records = [];
        downloads.forEach(function (download) {
            var record = new _voOfflineDownloadVo2['default']();
            record.id = download.getId();
            record.progress = download.getDownloadProgression();
            record.url = download.getOfflineUrl();
            record.originalUrl = download.getManifestUrl();
            record.status = download.getStatus();
            records.push(record);
        });
        return records;
    }

    /**
     * Create a new content record in storage and download manifest from url
     *
     * @param {string} manifestURL - the content manifest url
     * @return {Promise} asynchronously resolved with record identifier
     * @memberof module:OfflineController
     * @instance
     */
    function createRecord(manifestURL) {
        return new Promise(function (resolve, reject) {
            var id = generateManifestId();

            // create download controller
            var download = createDownloadFromId(id);

            download.downloadFromUrl(manifestURL).then(function () {
                download.initDownload();
                resolve(id);
            })['catch'](function (e) {
                logger.error('Failed to download ' + e);
                removeDownloadFromId(id).then(function () {
                    reject(e);
                });
            });
        });
    }

    /**
     * Start downloading the record with selected tracks representations
     *
     * @param {string} id - record identifier
     * @param {MediaInfo[]} mediaInfos - the selected tracks representations
     * @memberof module:OfflineController
     * @instance
     */
    function startRecord(id, mediaInfos) {
        var download = getDownloadFromId(id);
        if (download) {
            download.startDownload(mediaInfos);
        }
    }

    /**
     * Stop downloading of the record
     *
     * @param {string} id - record identifier
     * @memberof module:OfflineController
     * @instance
     */
    function stopRecord(id) {
        var download = getDownloadFromId(id);
        if (download) {
            download.stopDownload();
        }
    }

    /**
     * Resume downloading of the record
     *
     * @param {string} id - record identifier
     * @memberof module:OfflineController
     * @instance
     */
    function resumeRecord(id) {
        var download = getDownloadFromId(id);
        if (download) {
            download.resumeDownload();
        }
    }

    /**
     * Deletes a record from storage
     *
     * @param {string} id - record identifier
     * @memberof module:OfflineController
     * @instance
     */
    function deleteRecord(id) {
        return removeDownloadFromId(id).then(function () {
            return offlineStoreController.deleteDownloadById(id);
        });
    }

    /**
     * Get download progression of a record
     *
     * @param {string} id - record identifier
     * @return {number} percentage progression
     * @memberof module:OfflineController
     * @instance
     */
    function getRecordProgression(id) {
        var download = getDownloadFromId(id);
        if (download) {
            return download.getDownloadProgression();
        }
        return 0;
    }

    /**
     * Reset all records
     * @memberof module:OfflineController
     * @instance
     */
    function resetRecords() {
        downloads.forEach(function (download) {
            download.resetDownload();
        });
    }

    /**
     * Reset
     * @instance
     */
    function reset() {
        resetRecords();
        schemeLoaderFactory.unregisterLoader(_constantsOfflineConstants2['default'].OFFLINE_SCHEME);
    }

    instance = {
        loadRecordsFromStorage: loadRecordsFromStorage,
        createRecord: createRecord,
        startRecord: startRecord,
        stopRecord: stopRecord,
        resumeRecord: resumeRecord,
        deleteRecord: deleteRecord,
        getRecordProgression: getRecordProgression,
        getAllRecords: getAllRecords,
        resetRecords: resetRecords,
        reset: reset
    };

    setup();

    return instance;
}

OfflineController.__dashjs_factory_name = 'OfflineController';
var factory = dashjs.FactoryMaker.getClassFactory(OfflineController); /* jshint ignore:line */
factory.events = _eventsOfflineEvents2['default'];
factory.errors = _errorsOfflineErrors2['default'];
dashjs.FactoryMaker.updateClassFactory(OfflineController.__dashjs_factory_name, factory); /* jshint ignore:line */
exports['default'] = factory;
module.exports = exports['default'];

},{"49":49,"52":52,"54":54,"55":55,"56":56,"58":58,"61":61,"62":62}],54:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _storageIndexDBStore = _dereq_(59);

var _storageIndexDBStore2 = _interopRequireDefault(_storageIndexDBStore);

var _errorsOfflineErrors = _dereq_(55);

var _errorsOfflineErrors2 = _interopRequireDefault(_errorsOfflineErrors);

/**
 * @class OfflineStoreController
 * @description This class manages database store
 * @param {object} config
 * @ignore
 */
function OfflineStoreController(config) {

    config = config || {};
    var context = this.context;
    var errHandler = config.errHandler;

    var instance = undefined,
        indexDBStore = undefined;

    function setup() {
        indexDBStore = (0, _storageIndexDBStore2['default'])(context).getInstance();
    }

    function createFragmentStore(manifestId, storeName) {
        try {
            indexDBStore.createFragmentStore(manifestId, storeName);
        } catch (err) {
            manageDOMError(err);
        }
    }

    function storeFragment(manifestId, fragmentId, fragmentData) {
        return indexDBStore.storeFragment(manifestId, fragmentId, fragmentData)['catch'](function (err) {
            manageDOMError(err);
        });
    }

    function createOfflineManifest(manifest) {
        return indexDBStore.storeManifest(manifest)['catch'](function (err) {
            manageDOMError(err);
        });
    }

    function updateOfflineManifest(manifest) {
        return indexDBStore.updateManifest(manifest)['catch'](function (err) {
            manageDOMError(err);
        });
    }

    function getManifestById(manifestId) {
        return indexDBStore.getManifestById(manifestId)['catch'](function (err) {
            manageDOMError(err);
        });
    }

    function saveSelectedRepresentations(manifestId, selected) {
        return indexDBStore.saveSelectedRepresentations(manifestId, selected)['catch'](function (err) {
            manageDOMError(err);
        });
    }

    function getCurrentHigherManifestId() {
        return indexDBStore.getCurrentHigherManifestId()['catch'](function (err) {
            manageDOMError(err);
        });
    }

    function getAllManifests() {
        return indexDBStore.getAllManifests()['catch'](function (err) {
            manageDOMError(err);
        });
    }

    function deleteDownloadById(manifestId) {
        return indexDBStore.deleteDownloadById(manifestId)['catch'](function (err) {
            manageDOMError(err);
        });
    }

    function setDownloadingStatus(manifestId, status) {
        return indexDBStore.setDownloadingStatus(manifestId, status)['catch'](function (err) {
            manageDOMError(err);
        });
    }

    function setRepresentationCurrentState(manifestId, representationId, state) {
        return indexDBStore.setRepresentationCurrentState(manifestId, representationId, state)['catch'](function (err) {
            manageDOMError(err);
        });
    }

    function getRepresentationCurrentState(manifestId, representationId) {
        return indexDBStore.getRepresentationCurrentState(manifestId, representationId)['catch'](function (err) {
            manageDOMError(err);
        });
    }

    function manageDOMError(err) {
        var error = undefined;
        if (err) {
            switch (err.name) {
                case 'QuotaExceededError':
                    error = _errorsOfflineErrors2['default'].INDEXEDDB_QUOTA_EXCEED_ERROR;
                    break;
                case 'InvalidStateError':
                    error = _errorsOfflineErrors2['default'].INDEXEDDB_INVALID_STATE_ERROR;
                    break;
                case 'NotFoundError':
                    error = _errorsOfflineErrors2['default'].INDEXEDDB_NOT_FOUND_ERROR;
                    break;
                case 'VersionError':
                    error = _errorsOfflineErrors2['default'].INDEXEDDB_VERSION_ERROR;
                    break;
                // TODO : Manage all DOM cases
            }

            // avoid importing DashJSError object from streaming
            errHandler.error({ code: error, message: err.name, data: err });
        }
    }

    instance = {
        storeFragment: storeFragment,
        createOfflineManifest: createOfflineManifest,
        updateOfflineManifest: updateOfflineManifest,
        getManifestById: getManifestById,
        saveSelectedRepresentations: saveSelectedRepresentations,
        createFragmentStore: createFragmentStore,
        getCurrentHigherManifestId: getCurrentHigherManifestId,
        getAllManifests: getAllManifests,
        deleteDownloadById: deleteDownloadById,
        setDownloadingStatus: setDownloadingStatus,
        setRepresentationCurrentState: setRepresentationCurrentState,
        getRepresentationCurrentState: getRepresentationCurrentState
    };

    setup();

    return instance;
}

OfflineStoreController.__dashjs_factory_name = 'OfflineStoreController';
exports['default'] = dashjs.FactoryMaker.getClassFactory(OfflineStoreController);
/* jshint ignore:line */
module.exports = exports['default'];

},{"55":55,"59":59}],55:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreErrorsErrorsBase = _dereq_(15);

var _coreErrorsErrorsBase2 = _interopRequireDefault(_coreErrorsErrorsBase);

/**
 * Offline Errors declaration
 * @class
 */

var OfflineErrors = (function (_ErrorsBase) {
  _inherits(OfflineErrors, _ErrorsBase);

  function OfflineErrors() {
    _classCallCheck(this, OfflineErrors);

    _get(Object.getPrototypeOf(OfflineErrors.prototype), 'constructor', this).call(this);

    /**
     * Error code returned when an error occurs in offline module
     */
    this.OFFLINE_ERROR = 11000;

    // Based upon https://developer.mozilla.org/fr/docs/Web/API/DOMException
    this.INDEXEDDB_QUOTA_EXCEED_ERROR = 11001;
    this.INDEXEDDB_INVALID_STATE_ERROR = 11002;
    this.INDEXEDDB_NOT_READABLE_ERROR = 11003;
    this.INDEXEDDB_NOT_FOUND_ERROR = 11004;
    this.INDEXEDDB_NETWORK_ERROR = 11005;
    this.INDEXEDDB_DATA_ERROR = 11006;
    this.INDEXEDDB_TRANSACTION_INACTIVE_ERROR = 11007;
    this.INDEXEDDB_NOT_ALLOWED_ERROR = 11008;
    this.INDEXEDDB_NOT_SUPPORTED_ERROR = 11009;
    this.INDEXEDDB_VERSION_ERROR = 11010;
    this.INDEXEDDB_TIMEOUT_ERROR = 11011;
    this.INDEXEDDB_ABORT_ERROR = 11012;
    this.INDEXEDDB_UNKNOWN_ERROR = 11013;
  }

  return OfflineErrors;
})(_coreErrorsErrorsBase2['default']);

var offlineErrors = new OfflineErrors();
exports['default'] = offlineErrors;
module.exports = exports['default'];

},{"15":15}],56:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreEventsEventsBase = _dereq_(18);

var _coreEventsEventsBase2 = _interopRequireDefault(_coreEventsEventsBase);

/**
 * These are offline events that should be sent to the player level.
 * @class
 */

var OfflineEvents = (function (_EventsBase) {
    _inherits(OfflineEvents, _EventsBase);

    function OfflineEvents() {
        _classCallCheck(this, OfflineEvents);

        _get(Object.getPrototypeOf(OfflineEvents.prototype), 'constructor', this).call(this);

        /**
        * Triggered when all mediaInfo has been loaded
        * @event OfflineEvents#OFFLINE_RECORD_LOADEDMETADATA
        */
        this.OFFLINE_RECORD_LOADEDMETADATA = 'public_offlineRecordLoadedmetadata';

        /**
        * Triggered when a record is initialized and download is started
        * @event OfflineEvents#OFFLINE_RECORD_STARTED
        */
        this.OFFLINE_RECORD_STARTED = 'public_offlineRecordStarted';

        /**
        * Triggered when the user stop downloading a record
        * @event OfflineEvents#OFFLINE_RECORD_STOPPED
        */
        this.OFFLINE_RECORD_STOPPED = 'public_offlineRecordStopped';

        /**
        * Triggered when all record has been downloaded
        * @event OfflineEvents#OFFLINE_RECORD_FINISHED
        */
        this.OFFLINE_RECORD_FINISHED = 'public_offlineRecordFinished';
    }

    return OfflineEvents;
})(_coreEventsEventsBase2['default']);

var offlineEvents = new OfflineEvents();
exports['default'] = offlineEvents;
module.exports = exports['default'];

},{"18":18}],57:[function(_dereq_,module,exports){
(function (global){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _controllersOfflineController = _dereq_(53);

var _controllersOfflineController2 = _interopRequireDefault(_controllersOfflineController);

// Shove both of these into the global scope
var context = typeof window !== 'undefined' && window || global;

var dashjs = context.dashjs;
if (!dashjs) {
  dashjs = context.dashjs = {};
}

dashjs.OfflineController = _controllersOfflineController2['default'];

exports['default'] = dashjs;
exports.OfflineController = _controllersOfflineController2['default'];

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"53":53}],58:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _storageIndexDBStore = _dereq_(59);

var _storageIndexDBStore2 = _interopRequireDefault(_storageIndexDBStore);

function IndexDBOfflineLoader(config) {
    config = config || {};
    var context = this.context;
    var urlUtils = config.urlUtils;
    var constants = config.constants;
    var dashConstants = config.dashConstants;

    var instance = undefined,
        indexDBStore = undefined;

    function setup() {
        indexDBStore = (0, _storageIndexDBStore2['default'])(context).getInstance();
    }

    function getManifestId(url) {
        var myURL = urlUtils.removeHostname(url);
        var parts = myURL.split('/');
        return parts[0];
    }
    /**
     * Load manifest or fragment from indexeddb database
     * @param {object} config configuration of request
     */
    function load(config) {
        if (config.request) {
            var manifestId = getManifestId(config.request.url);
            if (manifestId % 1 === 0) {
                if (config.request.mediaType === constants.AUDIO || config.request.mediaType === constants.VIDEO || config.request.mediaType === constants.TEXT || config.request.mediaType === constants.MUXED || config.request.mediaType === constants.IMAGE || config.request.mediaType === constants.FRAGMENTED_TEXT || config.request.mediaType === constants.EMBEDDED_TEXT) {
                    var suffix = config.request.type === 'InitializationSegment' ? 'init' : config.request.index;
                    var key = config.request.representationId + '_' + suffix;
                    indexDBStore.getFragmentByKey(manifestId, key).then(function (fragment) {
                        config.success(fragment, null, config.request.url, constants.ARRAY_BUFFER);
                    })['catch'](function (err) {
                        config.error(err);
                    });
                } else if (config.request.type === dashConstants.MPD) {
                    indexDBStore.getManifestById(manifestId).then(function (item) {
                        indexDBStore.createFragmentStore(item.fragmentStore);
                        config.success(item.manifest, null, config.request.url, constants.XML);
                    })['catch'](function (err) {
                        config.error(config.request, 404, err);
                    });
                }
            } else {
                config.error(config.request, null, 'MediaType can not be found');
            }
        }
    }

    function abort() {
        // nothing to do
    }

    setup();

    instance = {
        load: load,
        abort: abort
    };

    return instance;
}

IndexDBOfflineLoader.__dashjs_factory_name = 'IndexDBOfflineLoader';
var factory = dashjs.FactoryMaker.getClassFactory(IndexDBOfflineLoader); /* jshint ignore:line */
exports['default'] = factory;
module.exports = exports['default'];

},{"59":59}],59:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var localforage = _dereq_(8);
var entities = _dereq_(4).XmlEntities;

/**
 * @ignore
 */
function IndexDBStore() {

    var instance = undefined,
        manifestStore = undefined,
        fragmentStores = undefined;

    function setup() {
        fragmentStores = {};

        if (typeof window === 'undefined') {
            return;
        }

        localforage.config({
            driver: localforage.INDEXEDDB,
            name: 'dash_offline_db'
        });

        manifestStore = localforage.createInstance({
            driver: localforage.INDEXEDDB,
            name: 'dash_offline_db',
            version: 1.0,
            storeName: 'manifest'
        });
    }

    /////////////////////////////////////////
    //
    // GET/SET Methods
    //
    ////////////////////////////////////////

    /**
     * Creates an instance of localforage to store fragments in indexed db
     * @param {string} storeName
     * @instance
     */
    function createFragmentStore(storeName) {

        if (!fragmentStores[storeName]) {
            console.log('setStore  ' + storeName);
            var fragmentStore = localforage.createInstance({
                driver: localforage.INDEXEDDB,
                name: 'dash_offline_db',
                version: 1.0,
                storeName: storeName
            });
            fragmentStores[storeName] = fragmentStore;
        }
    }

    /**
     * Update download status
     * @param {number} manifestId
     * @param {string} newStatus
     * @returns {Promise} promise
     * @instance
     */
    function setDownloadingStatus(manifestId, newStatus) {
        return getManifestById(manifestId).then(function (item) {
            item.status = newStatus;
            return updateManifest(item)['catch'](function () {
                return Promise.reject('Cannot set status ' + newStatus + ' for this stream !');
            });
        })['catch'](function (err) {
            return Promise.reject(err);
        });
    }

    /**
     * Updat last downloaded fragment index for representationId
     * @param {number} manifestId - manifest id
      * @param {string} representationId - representation
     * @param {number} state - representation state
     * @returns {Promise} promise
     * @instance
     */
    function setRepresentationCurrentState(manifestId, representationId, state) {
        return getManifestById(manifestId).then(function (item) {
            if (!item.state) {
                item.state = {};
            }

            if (!item.state[representationId]) {
                item.state[representationId] = {
                    index: -1,
                    downloaded: 0
                };
            }

            item.state[representationId] = state;
            return updateManifest(item)['catch'](function () {
                return Promise.reject('Cannot set current index for represenation id ' + representationId);
            });
        })['catch'](function (err) {
            return Promise.reject(err);
        });
    }

    /**
     * Returns current downloaded segment index for representation
     * @param {number} manifestId - manifest id
     * @param {string} representationId - representation
     * @returns {Promise} promise
     * @instance
     */
    function getRepresentationCurrentState(manifestId, representationId) {
        return getManifestById(manifestId).then(function (item) {
            var state = {
                index: -1,
                downloaded: 0
            };
            if (item.state && item.state[representationId]) {
                state = item.state[representationId];
            }
            return Promise.resolve(state);
        })['catch'](function (err) {
            return Promise.reject(err);
        });
    }

    /**
     * Returns a fragment from its key
     * @param {number} manifestId
     * @param {number} key
     * @returns {Promise} fragment
     * @instance
     */
    function getFragmentByKey(manifestId, key) {
        var fragmentStore = fragmentStores[manifestId];

        if (!fragmentStore) {
            return Promise.reject(new Error('No fragment store found for manifest ' + manifestId));
        }

        return fragmentStore.getItem(key).then(function (value) {
            return Promise.resolve(value);
        })['catch'](function (err) {
            return Promise.reject(err);
        });
    }

    /**
     * Returns a manifest from its identifier
     * @param {number} id
     * @returns {Promise} {Object[]} manifests
     * @instance
     */
    function getManifestById(id) {
        return getAllManifests().then(function (array) {
            if (array) {
                var item = null;
                for (var i = 0; i < array.manifests.length; i++) {
                    if (array.manifests[i].manifestId === parseInt(id)) {
                        item = array.manifests[i];
                    }
                }
                if (item !== null) {
                    item.manifest = entities.decode(item.manifest);
                    return Promise.resolve(item);
                } else {
                    return Promise.reject('Cannot found manifest with this manifestId : ' + id);
                }
            } else {
                return Promise.reject('Any manifests stored in DB !');
            }
        })['catch'](function (err) {
            return Promise.reject(err);
        });
    }

    /**
     * Returns all offline manifests
     * @returns {Promise} {Object[]} manifests
     * @instance
     */
    function getAllManifests() {
        return manifestStore.getItem('manifest').then(function (array) {
            return Promise.resolve(array ? array : {
                'manifests': []
            });
        })['catch'](function (err) {
            return Promise.reject(err);
        });
    }

    /**
     * Return higher manifest id
     * @returns {Promise} number
     * @instance
     */
    function getCurrentHigherManifestId() {
        return getAllManifests().then(function (array) {
            var higherManifestId = 0;
            if (array) {
                for (var i = 0; i < array.manifests.length; i++) {
                    if (array.manifests[i].manifestId > higherManifestId) {
                        higherManifestId = array.manifests[i].manifestId;
                    }
                }
                return Promise.resolve(higherManifestId);
            } else {
                return Promise.resolve(higherManifestId);
            }
        })['catch'](function (err) {
            return Promise.reject(err);
        });
    }

    /**
     * Update manifest
     * @param {Object} manifest updated manifest
     * @returns {Promise} promise asynchronously resolved
     * @instance
     */
    function updateManifest(manifest) {
        return getAllManifests().then(function (array) {
            try {
                for (var i = 0; i < array.manifests.length; i++) {
                    if (array.manifests[i].manifestId === manifest.manifestId) {
                        array.manifests[i] = manifest;
                    }
                }
                return manifestStore.setItem('manifest', array);
            } catch (err) {
                throw new Error('Any results found !');
            }
        });
    }

    /**
     * save selected representation by user
     * @param {Object} manifest updated manifest
     * @param {Object} selected selected representations
     * @returns {Promise} promise asynchronously resolved
     * @instance
     */
    function saveSelectedRepresentations(manifest, selected) {
        return getManifestById(manifest).then(function (item) {
            if (!item.selected) {
                item.selected = {};
            }

            item.selected = selected;
            return updateManifest(item)['catch'](function () {
                return Promise.reject('Cannot save selected representations');
            });
        })['catch'](function (err) {
            return Promise.reject(err);
        });
    }

    /**
     * Store a manifest in manifest array
     * @param {Object} manifest
     * @instance
     */
    function storeManifest(manifest) {
        return manifestStore.getItem('manifest').then(function (results) {
            var array = results ? results : {
                'manifests': []
            };
            array.manifests.push(manifest);
            return manifestStore.setItem('manifest', array);
        });
    }

    /**
     * Store a fragment in fragment store
     * @param {number} manifestId
     * @param {number} fragmentId
     * @param {Object} fragmentData
     * @returns {Promise} promise asynchronously resolved
     * @instance
     */
    function storeFragment(manifestId, fragmentId, fragmentData) {
        var fragmentStore = fragmentStores[manifestId];

        if (!fragmentStore) {
            return Promise.reject(new Error('No fragment store found for manifest ' + manifestId));
        }

        return fragmentStore.setItem(fragmentId, fragmentData, function () {
            return Promise.resolve();
        })['catch'](function (err) {
            return Promise.reject(err);
        });
    }

    /////////////////////////////////////////
    //
    // DROP Methods
    //
    ////////////////////////////////////////

    /**
     * Remove all manifest and fragment store
     * @returns {Promise} promise asynchronously resolved
     * @instance
     */
    function dropAll() {
        return localforage.clear().then(function () {
            return Promise.resolve();
        })['catch'](function (err) {
            return Promise.reject(err);
        });
    }

    /**
     * Remove framgent store given its name
     * @param {string} storeName
     * @instance
     */
    function dropFragmentStore(storeName) {
        localforage.dropInstance({
            driver: localforage.INDEXEDDB,
            name: 'dash_offline_db',
            version: 1.0,
            storeName: storeName
        }).then(function () {
            delete fragmentStores[storeName];
        })['catch'](function (err) {
            console.log('dropFragmentStore failed ' + err);
        });
        return;
    }

    /**
     * Remove download given its id (fragmentStore + manifest entry in manifest array)
     * @param {number} manifestId
     * @returns {Promise} promise asynchronously resolved
     * @instance
     */
    function deleteDownloadById(manifestId) {
        return manifestStore.getItem('manifest').then(function (array) {
            if (array) {
                return deleteFragmentStore(manifestId).then(function () {
                    for (var i = 0; i < array.manifests.length; i++) {
                        if (array.manifests[i].manifestId === parseInt(manifestId)) {
                            array.manifests.splice(i, 1);
                        }
                    }
                    return manifestStore.setItem('manifest', array).then(function () {
                        return Promise.resolve('This stream has been successfull removed !');
                    })['catch'](function () {
                        return Promise.reject('An error occured when trying to delete this manifest');
                    });
                });
            } else {
                return Promise.resolve('Nothing to delete !');
            }
        })['catch'](function (err) {
            return Promise.reject(err);
        });
    }

    /**
     * Remove fragment store
     * @param {string} storeName
     * @returns {Promise} promise asynchronously resolved
     * @instance
     */
    function deleteFragmentStore(storeName) {
        localforage.createInstance({
            name: 'dash_offline_db',
            storeName: storeName
        });
        return localforage.dropInstance({
            name: 'dash_offline_db',
            storeName: storeName
        }).then(function () {
            delete fragmentStores[storeName];
            return Promise.resolve();
        })['catch'](function (err) {
            console.log(err);
            return Promise.reject(err);
        });
    }

    setup();

    instance = {
        dropAll: dropAll,
        getFragmentByKey: getFragmentByKey,
        getManifestById: getManifestById,
        storeFragment: storeFragment,
        storeManifest: storeManifest,
        updateManifest: updateManifest,
        saveSelectedRepresentations: saveSelectedRepresentations,
        createFragmentStore: createFragmentStore,
        setDownloadingStatus: setDownloadingStatus,
        setRepresentationCurrentState: setRepresentationCurrentState,
        getRepresentationCurrentState: getRepresentationCurrentState,
        getCurrentHigherManifestId: getCurrentHigherManifestId,
        getAllManifests: getAllManifests,
        dropFragmentStore: dropFragmentStore,
        deleteDownloadById: deleteDownloadById
    };

    return instance;
}

IndexDBStore.__dashjs_factory_name = 'IndexDBStore';
exports['default'] = dashjs.FactoryMaker.getSingletonFactory(IndexDBStore);
/* jshint ignore:line */
module.exports = exports['default'];

},{"4":4,"8":8}],60:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var Entities = _dereq_(4).XmlEntities;
var OFFLINE_BASE_URL = 'offline_indexeddb://';

function OfflineIndexDBManifestParser(config) {

    var manifestId = config.manifestId;
    var allMediaInfos = config.allMediaInfos;
    var urlUtils = config.urlUtils;
    var debug = config.debug;
    var dashConstants = config.dashConstants;
    var constants = config.constants;

    var instance = undefined,
        DOM = undefined,
        logger = undefined;

    function setup() {
        logger = debug.getLogger(instance);
    }

    /**
     * Parse XML manifest
     * @param {string} XMLDoc - xml manifest
     * @param {object} representation
     * @returns {Promise} a promise that will be resolved or rejected at the end of encoding process
     * @instance
    */
    function parse(XMLDoc, representation) {
        return new Promise(function (resolve, reject) {

            DOM = new DOMParser().parseFromString(XMLDoc, 'application/xml');
            var mpd = DOM.getElementsByTagName(dashConstants.MPD) ? DOM.getElementsByTagName(dashConstants.MPD) : null;

            for (var i = 0; i < mpd.length; i++) {
                if (mpd[i] !== null) {
                    editBaseURLAttribute(mpd[i]);
                    browsePeriods(mpd[i], representation);
                }
            }

            var manifestEncoded = encodeManifest(DOM);
            if (manifestEncoded !== '') {
                resolve(manifestEncoded);
            } else {
                reject('Encoded error');
            }
        });
    }

    /**
     * URL encode parsed manifest
     * @param {string} DOM
     * @returns {string} Url encoded XML
     * @instance
    */
    function encodeManifest(DOM) {
        logger.info('encodedManifest ' + new XMLSerializer().serializeToString(DOM));
        return new Entities().encode(new XMLSerializer().serializeToString(DOM));
    }

    /**
     * Update baseURL to point to local stored data P
     * @param {XML} currentMPD
     * @instance
    */
    function editBaseURLAttribute(currentMPD) {
        var basesURL = undefined,
            fragmentId = undefined,
            representationId = undefined;

        var url = '' + OFFLINE_BASE_URL + manifestId + '/';

        basesURL = currentMPD.getElementsByTagName(dashConstants.BASE_URL);

        if (basesURL.length === 0) {
            // add baseURL
            var element = DOM.createElement(dashConstants.BASE_URL);
            element.innerHTML = url;
            currentMPD.appendChild(element);
        }
        basesURL = currentMPD.getElementsByTagName(dashConstants.BASE_URL);
        for (var i = 0; i < basesURL.length; i++) {
            var _parent = basesURL[i].parentNode;

            if (_parent.nodeName === dashConstants.MPD) {
                basesURL[i].innerHTML = url;
            } else if (_parent.nodeName === dashConstants.REPRESENTATION) {
                var adaptationsSet = _parent.parentNode;
                if (adaptationsSet.nodeName == dashConstants.ADAPTATION_SET) {

                    if (urlUtils.isHTTPS(basesURL[i].innerHTML) || urlUtils.isHTTPURL(basesURL[i].innerHTML)) {
                        fragmentId = getFragmentId(basesURL[i].innerHTML);
                        representationId = getBestRepresentationId(adaptationsSet);
                        basesURL[i].innerHTML = url + representationId + '_' + fragmentId;
                    } else if (basesURL[i].innerHTML === './') {
                        basesURL[i].innerHTML = url;
                    } else {
                        fragmentId = getFragmentId(basesURL[i].innerHTML);
                        representationId = getBestRepresentationId(adaptationsSet);
                        basesURL[i].innerHTML = representationId + '_' + fragmentId;
                    }
                }
            } else {
                basesURL[i].innerHTML = url;
            }
        }
    }

    /**
     * Browse periods
     * @param {XML} currentMPD
     * @param {Object} representation
     * @instance
    */
    function browsePeriods(currentMPD, representation) {
        var periods = currentMPD.getElementsByTagName(dashConstants.PERIOD);
        for (var j = 0; j < periods.length; j++) {
            browseAdaptationsSet(periods[j], representation);
        }
    }

    /**
     * Browse adapatation set to update data (delete those taht are not choosen by user ...)
     * @param {XML} currentPeriod
     * @param {Array} representationsToUpdate
     * @instance
    */
    function browseAdaptationsSet(currentPeriod, representationsToUpdate) {
        var adaptationsSet = undefined,
            currentAdaptationSet = undefined,
            currentAdaptationType = undefined,
            representations = undefined;

        adaptationsSet = currentPeriod.getElementsByTagName(dashConstants.ADAPTATION_SET);

        for (var i = adaptationsSet.length - 1; i >= 0; i--) {
            currentAdaptationSet = adaptationsSet[i];
            if (currentAdaptationSet) {
                currentAdaptationType = findAdaptationType(currentAdaptationSet);
                representations = findRepresentations(currentAdaptationSet);

                findAndKeepOnlySelectedRepresentations(currentAdaptationSet, representations, currentAdaptationType);

                representations = findRepresentations(currentAdaptationSet);

                deleteSegmentBase(currentAdaptationSet);

                if (representations.length === 0) {
                    currentPeriod.removeChild(currentAdaptationSet);
                } else {
                    //detect Segment list use case
                    for (var _i = 0; _i < representations.length; _i++) {
                        var rep = representations[_i];
                        var segmentList = getSegmentList(rep);
                        if (segmentList.length >= 1) {
                            editSegmentListAttributes(segmentList, rep);
                        }
                    }

                    var segmentTemplate = getSegmentTemplate(currentAdaptationSet);
                    // segmentTemplate is defined, update attributes in order to be correctly played offline
                    if (segmentTemplate.length >= 1) {
                        editSegmentTemplateAttributes(segmentTemplate);
                    }

                    // detect SegmentBase use case => transfrom manifest to SegmentList in SegmentTemplate
                    if (representationsToUpdate && representationsToUpdate.length > 0) {
                        var selectedRep = undefined;
                        for (var _i2 = 0; _i2 < representations.length; _i2++) {
                            var rep = representations[_i2];
                            for (var j = 0; representationsToUpdate && j < representationsToUpdate.length; j++) {
                                if (representationsToUpdate[j].id === rep.id) {
                                    selectedRep = representationsToUpdate[j];
                                    break;
                                }
                            }
                        }
                        addSegmentTemplateAttributes(currentAdaptationSet, selectedRep);
                    }
                }
            }
        }
    }

    /**
     * Returns type of adapation set
     * @param {XML} currentAdaptationSet
     * @returns {string|null} type
     * @instance
    */
    function findAdaptationType(currentAdaptationSet) {
        if (getIsMuxed(currentAdaptationSet)) {
            return constants.MUXED;
        } else if (getIsAudio(currentAdaptationSet)) {
            return constants.AUDIO;
        } else if (getIsVideo(currentAdaptationSet)) {
            return constants.VIDEO;
        } else if (getIsFragmentedText(currentAdaptationSet)) {
            return constants.FRAGMENTED_TEXT;
        } else if (getIsImage(currentAdaptationSet)) {
            return constants.IMAGE;
        }

        return constants.TEXT;
    }

    function getIsAudio(adaptation) {
        return getIsTypeOf(adaptation, constants.AUDIO);
    }

    function getIsVideo(adaptation) {
        return getIsTypeOf(adaptation, constants.VIDEO);
    }

    function getIsFragmentedText(adaptation) {
        return getIsTypeOf(adaptation, constants.FRAGMENTED_TEXT);
    }

    function getIsMuxed(adaptation) {
        return getIsTypeOf(adaptation, constants.MUXED);
    }

    function getIsImage(adaptation) {
        return getIsTypeOf(adaptation, constants.IMAGE);
    }

    // based upon DashManifestModel, but using DomParser
    function getIsTypeOf(adaptation, type) {

        if (!adaptation) {
            throw new Error('adaptation is not defined');
        }

        if (!type) {
            throw new Error('type is not defined');
        }

        // 1. check codecs for fragmented text
        if (isFragmentedTextCodecFound(adaptation)) {
            // fragmented text codec has been found for adaptation, let's check if tested type is fragmented text
            return type === constants.FRAGMENTED_TEXT;
        }

        // 2. test mime type
        return testMimeType(adaptation, type);
    }

    function testMimeType(adaptation, type) {
        var mimeTypeRegEx = type !== constants.TEXT ? new RegExp(type) : new RegExp('(vtt|ttml)');

        var mimeType = findMimeType(adaptation);
        if (mimeType) {
            return mimeTypeRegEx.test(mimeType);
        }

        // no mime type in adaptation, search in representation
        var representations = findRepresentations(adaptation);
        if (representations) {
            for (var i = 0; i < representations.length; i++) {
                var representation = representations[i];
                mimeType = findMimeType(representation);
                if (mimeType) {
                    return mimeTypeRegEx.test(mimeType);
                }
            }
        }
        return false;
    }

    /**
     * Search for fragmented text codec in adaptation (STPP or WVTT)
     * @param {Object} adaptation
     */
    function isFragmentedTextCodecFound(adaptation) {
        var isFragmentedTextCodecFoundInTag = function isFragmentedTextCodecFoundInTag(tag) {
            var codecs = tag.getAttribute(dashConstants.CODECS);
            if (codecs) {
                if (codecs.search(constants.STPP) === 0 || codecs.search(constants.WVTT) === 0) {
                    return true;
                }
            }
            return false;
        };

        if (isFragmentedTextCodecFoundInTag(adaptation)) {
            return true;
        }

        // check in representations
        var representations = findRepresentations(adaptation);
        if (representations && representations.length > 0) {

            if (isFragmentedTextCodecFoundInTag(representations[0])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns mime-type of xml tag
     * @param {Object} tag
     * @returns {string|null} mimeType
     * @instance
    */
    function findMimeType(tag) {
        return tag.getAttribute(dashConstants.MIME_TYPE);
    }

    /**
     * Returns representations of adaptation set
     * @param {XML} adaptation
     * @returns {XML} representations
     * @instance
    */
    function findRepresentations(adaptation) {
        return adaptation.getElementsByTagName(dashConstants.REPRESENTATION);
    }

    /**
     * Return segment template list of adaptations set
     * @param {XML} currentAdaptationSet
     * @returns {XML} representations
     * @instance
    */
    function getSegmentTemplate(currentAdaptationSet) {
        return currentAdaptationSet.getElementsByTagName(dashConstants.SEGMENT_TEMPLATE);
    }

    /**
     * Return segment list tags of adaptations set
     * @param {XML} tag
     * @returns {XML} representations
     * @instance
    */
    function getSegmentList(tag) {
        return tag.getElementsByTagName(dashConstants.SEGMENT_LIST);
    }

    function deleteSegmentBase(tag) {
        var elements = tag.getElementsByTagName(dashConstants.SEGMENT_BASE);
        for (var i = 0; i < elements.length; i++) {
            var segmentBase = elements[i];
            segmentBase.parentNode.removeChild(segmentBase);
        }
    }

    /**
     * @param {XML} segmentTemplate
     * @param {object} rep
     * @instance
    */
    function addSegmentTimelineElements(segmentTemplate, rep) {
        var S = DOM.createElement('S');
        if (rep && rep.segments) {
            var segmentTimelineElement = DOM.createElement(dashConstants.SEGMENT_TIMELINE);
            var changedDuration = getDurationChangeArray(rep);
            for (var i = 0; i < changedDuration.length; i++) {
                var repeatValue = i + 1 < changedDuration.length ? changedDuration[i + 1] - changedDuration[i] - 1 : 0;
                if (repeatValue > 1) {
                    S.setAttribute('r', repeatValue);
                }
                S.setAttribute('d', rep.segments[changedDuration[i]].duration);
                segmentTimelineElement.appendChild(S);
                S = DOM.createElement('S');
            }
            segmentTemplate.appendChild(segmentTimelineElement);
        }
    }

    function getDurationChangeArray(rep) {
        var array = [];
        array.push(0);
        for (var i = 1; i < rep.segments.length; i++) {
            if (rep.segments[i - 1].duration !== rep.segments[i].duration) {
                array.push(i);
            }
        }
        return array;
    }

    /**
     * Update attributes of segment templates to match offline urls
     * @param {Array} segmentsTemplates
     * @instance
    */
    function editSegmentTemplateAttributes(segmentsTemplates) {
        for (var i = 0; i < segmentsTemplates.length; i++) {
            var media = segmentsTemplates[i].getAttribute(dashConstants.MEDIA);
            media = '$RepresentationID$_$Number$' + media.substring(media.indexOf('.'), media.length); //id + extension
            segmentsTemplates[i].setAttribute(dashConstants.START_NUMBER, '0');
            segmentsTemplates[i].setAttribute(dashConstants.MEDIA, media);
            segmentsTemplates[i].setAttribute(dashConstants.INITIALIZATION_MINUS, '$RepresentationID$_init');
        }
    }

    /**
     * Update attributes of segment list to match offline urls
     * @param {Array} segmentLists
     * @param {Object} representation
     * @instance
    */
    function editSegmentListAttributes(segmentLists, representation) {
        var repId = representation.getAttribute(dashConstants.ID);
        for (var i = 0; i < segmentLists.length; i++) {

            var segmentList = segmentLists[i];
            var initialisation = segmentList.getElementsByTagName(dashConstants.INITIALIZATION);
            if (initialisation) {
                var sourceURL = initialisation[0].getAttribute(dashConstants.SOURCE_URL);
                sourceURL = repId + '_init';
                initialisation[0].setAttribute(dashConstants.SOURCE_URL, sourceURL);
            }
            var segmentURLs = segmentList.getElementsByTagName(dashConstants.SEGMENT_URL);

            if (segmentURLs) {
                for (var j = 0; j < segmentURLs.length; j++) {
                    var segmentUrl = segmentURLs[j];
                    var media = segmentUrl.getAttribute(dashConstants.MEDIA);
                    media = repId + '_' + j;
                    segmentUrl.setAttribute(dashConstants.MEDIA, media);
                }
            }
        }
    }

    /**
     * @param {XML} adaptationSet
     * @param {object} rep
     * @instance
    */
    function addSegmentTemplateAttributes(adaptationSet, rep) {
        var segmentTemplateElement = DOM.createElement(dashConstants.SEGMENT_TEMPLATE);
        segmentTemplateElement.setAttribute(dashConstants.START_NUMBER, '0');
        segmentTemplateElement.setAttribute(dashConstants.MEDIA, '$RepresentationID$-$Time$');
        segmentTemplateElement.setAttribute(dashConstants.INITIALIZATION_MINUS, '$RepresentationID$_init');
        addSegmentTimelineElements(segmentTemplateElement, rep);
        adaptationSet.appendChild(segmentTemplateElement);
    }

    /**
     * Delete all representations except the one choosed by user
     * @param {XML} currentAdaptationSet
     * @param {XML} representations
     * @param {string} adaptationType
     * @instance
    */
    function findAndKeepOnlySelectedRepresentations(currentAdaptationSet, representations, adaptationType) {
        for (var i = representations.length - 1; i >= 0; i--) {
            var representation = representations[i];
            var repId = representation.getAttribute(dashConstants.ID);
            if (allMediaInfos[adaptationType] && allMediaInfos[adaptationType].indexOf(repId) === -1) {
                // representation is not selected, remove it
                currentAdaptationSet.removeChild(representation);
            }
        }
    }

    //  UTILS
    /**
     * Get id of first representation of adaptation set
     * @param {XMl} currentAdaptationSet
     * @returns {string} id
     * @instance
    */
    function getBestRepresentationId(currentAdaptationSet) {
        var bestRepresentation = currentAdaptationSet.getElementsByTagName(dashConstants.REPRESENTATION)[0];
        console.log(bestRepresentation.getAttribute(dashConstants.ID));
        return bestRepresentation.getAttribute(dashConstants.ID);
    }

    /**
     * Parse and returns fragments of offline url => xxxx://xxxx/fragmentId/
     * @param {string} url
     * @returns {string} fragmentId
     * @instance
    */
    function getFragmentId(url) {
        var idxFragId = url.lastIndexOf('/');
        //logger.warn('fragId : ' + url.substring(idxFragId + 1, url.length));
        return url.substring(idxFragId, url.length);
    }

    setup();

    instance = {
        parse: parse
    };

    return instance;
}
OfflineIndexDBManifestParser.__dashjs_factory_name = 'OfflineIndexDBManifestParser';
exports['default'] = dashjs.FactoryMaker.getClassFactory(OfflineIndexDBManifestParser);
/* jshint ignore:line */
module.exports = exports['default'];

},{"4":4}],61:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _constantsOfflineConstants = _dereq_(52);

var _constantsOfflineConstants2 = _interopRequireDefault(_constantsOfflineConstants);

function OfflineUrlUtils() {

    function setup() {}

    function getRegex() {
        return _constantsOfflineConstants2['default'].OFFLINE_URL_REGEX;
    }

    /*
     * -------------------
     * SPECIFIC BEHAVIOUR
     * -------------------
     */
    function removeHostname(url) {
        return url.replace(/(^\w+:|^)\/\//, '');
    }

    function isRelative() {
        return false;
    }

    function resolve(url, baseUrl) {
        if (baseUrl.charAt(baseUrl.length - 1) !== '/') {
            baseUrl = baseUrl.concat('/');
        }
        return baseUrl + url;
    }

    setup();
    var instance = {
        getRegex: getRegex,
        isRelative: isRelative,
        removeHostname: removeHostname,
        resolve: resolve
    };
    return instance;
}

OfflineUrlUtils.__dashjs_factory_name = 'OfflineUrlUtils';
exports['default'] = dashjs.FactoryMaker.getSingletonFactory(OfflineUrlUtils);
/* jshint ignore:line */
module.exports = exports['default'];

},{"52":52}],62:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var OfflineDownload = function OfflineDownload() {
  _classCallCheck(this, OfflineDownload);

  this.id = null;
  this.url = null;
  this.originalUrl = null;
  this.status = null;
  this.progress = null;
};

exports["default"] = OfflineDownload;
module.exports = exports["default"];

},{}],63:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _constantsConstants = _dereq_(65);

var _constantsConstants2 = _interopRequireDefault(_constantsConstants);

var _netURLLoader = _dereq_(72);

var _netURLLoader2 = _interopRequireDefault(_netURLLoader);

var _voHeadRequest = _dereq_(83);

var _voHeadRequest2 = _interopRequireDefault(_voHeadRequest);

var _voDashJSError = _dereq_(81);

var _voDashJSError2 = _interopRequireDefault(_voDashJSError);

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

function FragmentLoader(config) {

    config = config || {};
    var context = this.context;
    var eventBus = config.eventBus;
    var events = config.events;
    var urlUtils = config.urlUtils;
    var errors = config.errors;

    var instance = undefined,
        urlLoader = undefined;

    function setup() {
        urlLoader = (0, _netURLLoader2['default'])(context).create({
            errHandler: config.errHandler,
            errors: errors,
            dashMetrics: config.dashMetrics,
            mediaPlayerModel: config.mediaPlayerModel,
            requestModifier: config.requestModifier,
            useFetch: config.settings.get().streaming.lowLatencyEnabled,
            urlUtils: urlUtils,
            constants: _constantsConstants2['default'],
            boxParser: config.boxParser,
            dashConstants: config.dashConstants,
            requestTimeout: config.settings.get().streaming.fragmentRequestTimeout
        });
    }

    function checkForExistence(request) {
        var report = function report(success) {
            eventBus.trigger(events.CHECK_FOR_EXISTENCE_COMPLETED, {
                request: request,
                exists: success
            });
        };

        if (request) {
            var headRequest = new _voHeadRequest2['default'](request.url);
            urlLoader.load({
                request: headRequest,
                success: function success() {
                    report(true);
                },
                error: function error() {
                    report(false);
                }
            });
        } else {
            report(false);
        }
    }

    function load(request) {
        var report = function report(data, error) {
            eventBus.trigger(events.LOADING_COMPLETED, {
                request: request,
                response: data || null,
                error: error || null,
                sender: instance
            });
        };

        if (request) {
            urlLoader.load({
                request: request,
                progress: function progress(event) {
                    eventBus.trigger(events.LOADING_PROGRESS, {
                        request: request,
                        stream: event.stream
                    });
                    if (event.data) {
                        eventBus.trigger(events.LOADING_DATA_PROGRESS, {
                            request: request,
                            response: event.data || null,
                            error: null,
                            sender: instance
                        });
                    }
                },
                success: function success(data) {
                    report(data);
                },
                error: function error(request, statusText, errorText) {
                    report(undefined, new _voDashJSError2['default'](errors.FRAGMENT_LOADER_LOADING_FAILURE_ERROR_CODE, errorText, statusText));
                },
                abort: function abort(request) {
                    if (request) {
                        eventBus.trigger(events.LOADING_ABANDONED, {
                            mediaType: request.mediaType,
                            request: request,
                            sender: instance
                        });
                    }
                }
            });
        } else {
            report(undefined, new _voDashJSError2['default'](errors.FRAGMENT_LOADER_NULL_REQUEST_ERROR_CODE, errors.FRAGMENT_LOADER_NULL_REQUEST_ERROR_MESSAGE));
        }
    }

    function abort() {
        if (urlLoader) {
            urlLoader.abort();
        }
    }

    function reset() {
        if (urlLoader) {
            urlLoader.abort();
            urlLoader = null;
        }
    }

    instance = {
        checkForExistence: checkForExistence,
        load: load,
        abort: abort,
        reset: reset
    };

    setup();

    return instance;
}

FragmentLoader.__dashjs_factory_name = 'FragmentLoader';
exports['default'] = _coreFactoryMaker2['default'].getClassFactory(FragmentLoader);
module.exports = exports['default'];

},{"11":11,"65":65,"72":72,"81":81,"83":83}],64:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreEventsEventsBase = _dereq_(18);

var _coreEventsEventsBase2 = _interopRequireDefault(_coreEventsEventsBase);

/**
 * @class
 * @implements EventsBase
 */

var MediaPlayerEvents = (function (_EventsBase) {
  _inherits(MediaPlayerEvents, _EventsBase);

  /**
   * @description Public facing external events to be used when developing a player that implements dash.js.
   */

  function MediaPlayerEvents() {
    _classCallCheck(this, MediaPlayerEvents);

    _get(Object.getPrototypeOf(MediaPlayerEvents.prototype), 'constructor', this).call(this);
    /**
     * Triggered when playback will not start yet
     * as the MPD's availabilityStartTime is in the future.
     * Check delay property in payload to determine time before playback will start.
     * @event MediaPlayerEvents#AST_IN_FUTURE
     */
    this.AST_IN_FUTURE = 'astInFuture';

    /**
     * Triggered when the video element's buffer state changes to stalled.
     * Check mediaType in payload to determine type (Video, Audio, FragmentedText).
     * @event MediaPlayerEvents#BUFFER_EMPTY
     */
    this.BUFFER_EMPTY = 'bufferStalled';

    /**
     * Triggered when the video element's buffer state changes to loaded.
     * Check mediaType in payload to determine type (Video, Audio, FragmentedText).
     * @event MediaPlayerEvents#BUFFER_LOADED
     */
    this.BUFFER_LOADED = 'bufferLoaded';

    /**
     * Triggered when the video element's buffer state changes, either stalled or loaded. Check payload for state.
     * @event MediaPlayerEvents#BUFFER_LEVEL_STATE_CHANGED
     */
    this.BUFFER_LEVEL_STATE_CHANGED = 'bufferStateChanged';

    /**
     * Triggered when a dynamic stream changed to static (transition phase between Live and On-Demand).
     * @event MediaPlayerEvents#DYNAMIC_TO_STATIC
     */
    this.DYNAMIC_TO_STATIC = 'dynamicToStatic';

    /**
     * Triggered when there is an error from the element or MSE source buffer.
     * @event MediaPlayerEvents#ERROR
     */
    this.ERROR = 'error';
    /**
     * Triggered when a fragment download has completed.
     * @event MediaPlayerEvents#FRAGMENT_LOADING_COMPLETED
     */
    this.FRAGMENT_LOADING_COMPLETED = 'fragmentLoadingCompleted';

    /**
     * Triggered when a partial fragment download has completed.
     * @event MediaPlayerEvents#FRAGMENT_LOADING_PROGRESS
     */
    this.FRAGMENT_LOADING_PROGRESS = 'fragmentLoadingProgress';
    /**
     * Triggered when a fragment download has started.
     * @event MediaPlayerEvents#FRAGMENT_LOADING_STARTED
     */
    this.FRAGMENT_LOADING_STARTED = 'fragmentLoadingStarted';

    /**
     * Triggered when a fragment download is abandoned due to detection of slow download base on the ABR abandon rule..
     * @event MediaPlayerEvents#FRAGMENT_LOADING_ABANDONED
     */
    this.FRAGMENT_LOADING_ABANDONED = 'fragmentLoadingAbandoned';

    /**
     * Triggered when {@link module:Debug} logger methods are called.
     * @event MediaPlayerEvents#LOG
     */
    this.LOG = 'log';

    //TODO refactor with internal event
    /**
     * Triggered when the manifest load is complete
     * @event MediaPlayerEvents#MANIFEST_LOADED
     */
    this.MANIFEST_LOADED = 'manifestLoaded';

    /**
     * Triggered anytime there is a change to the overall metrics.
     * @event MediaPlayerEvents#METRICS_CHANGED
     */
    this.METRICS_CHANGED = 'metricsChanged';

    /**
     * Triggered when an individual metric is added, updated or cleared.
     * @event MediaPlayerEvents#METRIC_CHANGED
     */
    this.METRIC_CHANGED = 'metricChanged';

    /**
     * Triggered every time a new metric is added.
     * @event MediaPlayerEvents#METRIC_ADDED
     */
    this.METRIC_ADDED = 'metricAdded';

    /**
     * Triggered every time a metric is updated.
     * @event MediaPlayerEvents#METRIC_UPDATED
     */
    this.METRIC_UPDATED = 'metricUpdated';

    /**
     * Triggered at the stream end of a period.
     * @event MediaPlayerEvents#PERIOD_SWITCH_COMPLETED
     */
    this.PERIOD_SWITCH_COMPLETED = 'periodSwitchCompleted';

    /**
     * Triggered when a new period starts.
     * @event MediaPlayerEvents#PERIOD_SWITCH_STARTED
     */
    this.PERIOD_SWITCH_STARTED = 'periodSwitchStarted';

    /**
     * Triggered when an ABR up /down switch is initiated; either by user in manual mode or auto mode via ABR rules.
     * @event MediaPlayerEvents#QUALITY_CHANGE_REQUESTED
     */
    this.QUALITY_CHANGE_REQUESTED = 'qualityChangeRequested';

    /**
     * Triggered when the new ABR quality is being rendered on-screen.
     * @event MediaPlayerEvents#QUALITY_CHANGE_RENDERED
     */
    this.QUALITY_CHANGE_RENDERED = 'qualityChangeRendered';

    /**
     * Triggered when the new track is being rendered.
     * @event MediaPlayerEvents#TRACK_CHANGE_RENDERED
     */
    this.TRACK_CHANGE_RENDERED = 'trackChangeRendered';

    /**
     * Triggered when the source is setup and ready.
     * @event MediaPlayerEvents#SOURCE_INITIALIZED
     */
    this.SOURCE_INITIALIZED = 'sourceInitialized';

    /**
     * Triggered when a stream (period) is being loaded
     * @event MediaPlayerEvents#STREAM_INITIALIZING
     */
    this.STREAM_INITIALIZING = 'streamInitializing';

    /**
     * Triggered when a stream (period) is loaded
     * @event MediaPlayerEvents#STREAM_UPDATED
     */
    this.STREAM_UPDATED = 'streamUpdated';

    /**
     * Triggered when a stream (period) is updated
     * @event MediaPlayerEvents#STREAM_INITIALIZED
     */
    this.STREAM_INITIALIZED = 'streamInitialized';

    /**
     * Triggered when the player has been reset.
     * @event MediaPlayerEvents#STREAM_TEARDOWN_COMPLETE
     */
    this.STREAM_TEARDOWN_COMPLETE = 'streamTeardownComplete';

    /**
     * Triggered once all text tracks detected in the MPD are added to the video element.
     * @event MediaPlayerEvents#TEXT_TRACKS_ADDED
     */
    this.TEXT_TRACKS_ADDED = 'allTextTracksAdded';

    /**
     * Triggered when a text track is added to the video element's TextTrackList
     * @event MediaPlayerEvents#TEXT_TRACK_ADDED
     */
    this.TEXT_TRACK_ADDED = 'textTrackAdded';

    /**
     * Triggered when a ttml chunk is parsed.
     * @event MediaPlayerEvents#TTML_PARSED
     */
    this.TTML_PARSED = 'ttmlParsed';

    /**
     * Triggered when a ttml chunk has to be parsed.
     * @event MediaPlayerEvents#TTML_TO_PARSE
     */
    this.TTML_TO_PARSE = 'ttmlToParse';

    /**
     * Triggered when a caption is rendered.
     * @event MediaPlayerEvents#CAPTION_RENDERED
     */
    this.CAPTION_RENDERED = 'captionRendered';

    /**
     * Triggered when the caption container is resized.
     * @event MediaPlayerEvents#CAPTION_CONTAINER_RESIZE
     */
    this.CAPTION_CONTAINER_RESIZE = 'captionContainerResize';

    /**
     * Sent when enough data is available that the media can be played,
     * at least for a couple of frames.  This corresponds to the
     * HAVE_ENOUGH_DATA readyState.
     * @event MediaPlayerEvents#CAN_PLAY
     */
    this.CAN_PLAY = 'canPlay';

    /**
     * Sent when playback completes.
     * @event MediaPlayerEvents#PLAYBACK_ENDED
     */
    this.PLAYBACK_ENDED = 'playbackEnded';

    /**
     * Sent when an error occurs.  The element's error
     * attribute contains more information.
     * @event MediaPlayerEvents#PLAYBACK_ERROR
     */
    this.PLAYBACK_ERROR = 'playbackError';

    /**
     * Sent when playback is not allowed (for example if user gesture is needed).
     * @event MediaPlayerEvents#PLAYBACK_NOT_ALLOWED
     */
    this.PLAYBACK_NOT_ALLOWED = 'playbackNotAllowed';

    /**
     * The media's metadata has finished loading; all attributes now
     * contain as much useful information as they're going to.
     * @event MediaPlayerEvents#PLAYBACK_METADATA_LOADED
     */
    this.PLAYBACK_METADATA_LOADED = 'playbackMetaDataLoaded';

    /**
     * Sent when playback is paused.
     * @event MediaPlayerEvents#PLAYBACK_PAUSED
     */
    this.PLAYBACK_PAUSED = 'playbackPaused';

    /**
     * Sent when the media begins to play (either for the first time, after having been paused,
     * or after ending and then restarting).
     *
     * @event MediaPlayerEvents#PLAYBACK_PLAYING
     */
    this.PLAYBACK_PLAYING = 'playbackPlaying';

    /**
     * Sent periodically to inform interested parties of progress downloading
     * the media. Information about the current amount of the media that has
     * been downloaded is available in the media element's buffered attribute.
     * @event MediaPlayerEvents#PLAYBACK_PROGRESS
     */
    this.PLAYBACK_PROGRESS = 'playbackProgress';

    /**
     * Sent when the playback speed changes.
     * @event MediaPlayerEvents#PLAYBACK_RATE_CHANGED
     */
    this.PLAYBACK_RATE_CHANGED = 'playbackRateChanged';

    /**
     * Sent when a seek operation completes.
     * @event MediaPlayerEvents#PLAYBACK_SEEKED
     */
    this.PLAYBACK_SEEKED = 'playbackSeeked';

    /**
     * Sent when a seek operation begins.
     * @event MediaPlayerEvents#PLAYBACK_SEEKING
     */
    this.PLAYBACK_SEEKING = 'playbackSeeking';

    /**
     * Sent when a seek operation has been asked.
     * @event MediaPlayerEvents#PLAYBACK_SEEK_ASKED
     */
    this.PLAYBACK_SEEK_ASKED = 'playbackSeekAsked';

    /**
     * Sent when the video element reports stalled
     * @event MediaPlayerEvents#PLAYBACK_STALLED
     */
    this.PLAYBACK_STALLED = 'playbackStalled';

    /**
     * Sent when playback of the media starts after having been paused;
     * that is, when playback is resumed after a prior pause event.
     *
     * @event MediaPlayerEvents#PLAYBACK_STARTED
     */
    this.PLAYBACK_STARTED = 'playbackStarted';

    /**
     * The time indicated by the element's currentTime attribute has changed.
     * @event MediaPlayerEvents#PLAYBACK_TIME_UPDATED
     */
    this.PLAYBACK_TIME_UPDATED = 'playbackTimeUpdated';

    /**
     * Sent when the media playback has stopped because of a temporary lack of data.
     *
     * @event MediaPlayerEvents#PLAYBACK_WAITING
     */
    this.PLAYBACK_WAITING = 'playbackWaiting';

    /**
     * Manifest validity changed - As a result of an MPD validity expiration event.
     * @event MediaPlayerEvents#MANIFEST_VALIDITY_CHANGED
     */
    this.MANIFEST_VALIDITY_CHANGED = 'manifestValidityChanged';

    /**
     * A gap occured in the timeline which requires a seek to the next period
     * @event MediaPlayerEvents#GAP_CAUSED_SEEK_TO_PERIOD_END
     */
    this.GAP_CAUSED_SEEK_TO_PERIOD_END = 'gapCausedSeekToPeriodEnd';

    /**
     * A gap occured in the timeline which requires an internal seek
     * @event MediaPlayerEvents#GAP_CAUSED_INTERNAL_SEEK
     */
    this.GAP_CAUSED_INTERNAL_SEEK = 'gapCausedInternalSeek';

    /**
     * Dash events are triggered at their respective start points on the timeline.
     * @event MediaPlayerEvents#EVENT_MODE_ON_START
     */
    this.EVENT_MODE_ON_START = 'eventModeOnStart';

    /**
     * Dash events are triggered as soon as they were parsed.
     * @event MediaPlayerEvents#EVENT_MODE_ON_RECEIVE
     */
    this.EVENT_MODE_ON_RECEIVE = 'eventModeOnReceive';

    /**
     * Event that is dispatched whenever the player encounters a potential conformance validation that might lead to unexpected/not optimal behavior
     * @event MediaPlayerEvents#CONFORMANCE_VIOLATION
     */
    this.CONFORMANCE_VIOLATION = 'conformanceViolation';
  }

  return MediaPlayerEvents;
})(_coreEventsEventsBase2['default']);

var mediaPlayerEvents = new MediaPlayerEvents();
exports['default'] = mediaPlayerEvents;
module.exports = exports['default'];

},{"18":18}],65:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Constants declaration
 * @class
 * @ignore
 * @hideconstructor
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Constants = (function () {
  _createClass(Constants, [{
    key: 'init',
    value: function init() {
      /**
       *  @constant {string} STREAM Stream media type. Mainly used to report metrics relative to the full stream
       *  @memberof Constants#
       *  @static
       */
      this.STREAM = 'stream';

      /**
       *  @constant {string} VIDEO Video media type
       *  @memberof Constants#
       *  @static
       */
      this.VIDEO = 'video';

      /**
       *  @constant {string} AUDIO Audio media type
       *  @memberof Constants#
       *  @static
       */
      this.AUDIO = 'audio';

      /**
       *  @constant {string} TEXT Text media type
       *  @memberof Constants#
       *  @static
       */
      this.TEXT = 'text';

      /**
       *  @constant {string} FRAGMENTED_TEXT Fragmented text media type
       *  @memberof Constants#
       *  @static
       */
      this.FRAGMENTED_TEXT = 'fragmentedText';

      /**
       *  @constant {string} EMBEDDED_TEXT Embedded text media type
       *  @memberof Constants#
       *  @static
       */
      this.EMBEDDED_TEXT = 'embeddedText';

      /**
       *  @constant {string} MUXED Muxed (video/audio in the same chunk) media type
       *  @memberof Constants#
       *  @static
       */
      this.MUXED = 'muxed';

      /**
       *  @constant {string} IMAGE Image media type
       *  @memberof Constants#
       *  @static
       */
      this.IMAGE = 'image';

      /**
       *  @constant {string} STPP STTP Subtitles format
       *  @memberof Constants#
       *  @static
       */
      this.STPP = 'stpp';

      /**
       *  @constant {string} TTML STTP Subtitles format
       *  @memberof Constants#
       *  @static
       */
      this.TTML = 'ttml';

      /**
       *  @constant {string} VTT STTP Subtitles format
       *  @memberof Constants#
       *  @static
       */
      this.VTT = 'vtt';

      /**
       *  @constant {string} WVTT STTP Subtitles format
       *  @memberof Constants#
       *  @static
       */
      this.WVTT = 'wvtt';

      /**
       *  @constant {string} ABR_STRATEGY_DYNAMIC Dynamic Adaptive bitrate algorithm
       *  @memberof Constants#
       *  @static
       */
      this.ABR_STRATEGY_DYNAMIC = 'abrDynamic';

      /**
       *  @constant {string} ABR_STRATEGY_BOLA Adaptive bitrate algorithm based on Bola (buffer level)
       *  @memberof Constants#
       *  @static
       */
      this.ABR_STRATEGY_BOLA = 'abrBola';

      /**
       *  @constant {string} ABR_STRATEGY_L2A Adaptive bitrate algorithm based on L2A (online learning)
       *  @memberof Constants#
       *  @static
       */
      this.ABR_STRATEGY_L2A = 'abrL2A';

      /**
       *  @constant {string} ABR_STRATEGY_LoLP Adaptive bitrate algorithm based on LoL+
       *  @memberof Constants#
       *  @static
       */
      this.ABR_STRATEGY_LoLP = 'abrLoLP';

      /**
       *  @constant {string} ABR_STRATEGY_THROUGHPUT Adaptive bitrate algorithm based on throughput
       *  @memberof Constants#
       *  @static
       */
      this.ABR_STRATEGY_THROUGHPUT = 'abrThroughput';

      /**
       *  @constant {string} ABR_FETCH_THROUGHPUT_CALUCUALTION_DOWNLOADED_DATA Throughput calculation based on downloaded data array
       *  @memberof Constants#
       *  @static
       */
      this.ABR_FETCH_THROUGHPUT_CALCULATION_DOWNLOADED_DATA = 'abrFetchThroughputCalculationDownloadedData';

      /**
       *  @constant {string} ABR_FETCH_THROUGHPUT_CALCULATION_MOOF_PARSING Throughput calculation based on moof parsing
       *  @memberof Constants#
       *  @static
       */
      this.ABR_FETCH_THROUGHPUT_CALCULATION_MOOF_PARSING = 'abrFetchThroughputCalculationMoofParsing';

      /**
       *  @constant {string} LIVE_CATCHUP_MODE_DEFAULT Throughput calculation based on moof parsing
       *  @memberof Constants#
       *  @static
       */
      this.LIVE_CATCHUP_MODE_DEFAULT = 'liveCatchupModeDefault';

      /**
       *  @constant {string} LIVE_CATCHUP_MODE_LOLP Throughput calculation based on moof parsing
       *  @memberof Constants#
       *  @static
       */
      this.LIVE_CATCHUP_MODE_LOLP = 'liveCatchupModeLoLP';

      /**
       *  @constant {string} MOVING_AVERAGE_SLIDING_WINDOW Moving average sliding window
       *  @memberof Constants#
       *  @static
       */
      this.MOVING_AVERAGE_SLIDING_WINDOW = 'slidingWindow';

      /**
       *  @constant {string} EWMA Exponential moving average
       *  @memberof Constants#
       *  @static
       */
      this.MOVING_AVERAGE_EWMA = 'ewma';

      /**
       *  @constant {string} BAD_ARGUMENT_ERROR Invalid Arguments type of error
       *  @memberof Constants#
       *  @static
       */
      this.BAD_ARGUMENT_ERROR = 'Invalid Arguments';

      /**
       *  @constant {string} MISSING_CONFIG_ERROR Missing configuration parameters type of error
       *  @memberof Constants#
       *  @static
       */
      this.MISSING_CONFIG_ERROR = 'Missing config parameter(s)';

      /**
       *  @constant {string} TRACK_SWITCH_MODE_ALWAYS_REPLACE used to clear the buffered data (prior to current playback position) after track switch. Default for audio
       *  @memberof Constants#
       *  @static
       */
      this.TRACK_SWITCH_MODE_ALWAYS_REPLACE = 'alwaysReplace';

      /**
       *  @constant {string} TRACK_SWITCH_MODE_NEVER_REPLACE used to forbid clearing the buffered data (prior to current playback position) after track switch. Defers to fastSwitchEnabled for placement of new data. Default for video
       *  @memberof Constants#
       *  @static
       */
      this.TRACK_SWITCH_MODE_NEVER_REPLACE = 'neverReplace';

      /**
       *  @constant {string} TRACK_SELECTION_MODE_HIGHEST_BITRATE makes the player select the track with a highest bitrate. This mode is a default mode.
       *  @memberof Constants#
       *  @static
       */
      this.TRACK_SELECTION_MODE_HIGHEST_BITRATE = 'highestBitrate';

      /**
       *  @constant {string} TRACK_SELECTION_MODE_HIGHEST_EFFICIENCY makes the player select the track with the lowest bitrate per pixel average.
       *  @memberof Constants#
       *  @static
       */
      this.TRACK_SELECTION_MODE_HIGHEST_EFFICIENCY = 'highestEfficiency';

      /**
       *  @constant {string} TRACK_SELECTION_MODE_WIDEST_RANGE makes the player select the track with a widest range of bitrates.
       *  @memberof Constants#
       *  @static
       */
      this.TRACK_SELECTION_MODE_WIDEST_RANGE = 'widestRange';

      this.LOCATION = 'Location';
      this.INITIALIZE = 'initialize';
      this.TEXT_SHOWING = 'showing';
      this.TEXT_HIDDEN = 'hidden';
      this.CC1 = 'CC1';
      this.CC3 = 'CC3';
      this.UTF8 = 'utf-8';
      this.SCHEME_ID_URI = 'schemeIdUri';
      this.START_TIME = 'starttime';
      this.SERVICE_DESCRIPTION_LL_SCHEME = 'urn:dvb:dash:lowlatency:scope:2019';
      this.SUPPLEMENTAL_PROPERTY_LL_SCHEME = 'urn:dvb:dash:lowlatency:critical:2019';
      this.XML = 'XML';
      this.ARRAY_BUFFER = 'ArrayBuffer';
      this.DVB_REPORTING_URL = 'dvb:reportingUrl';
      this.DVB_PROBABILITY = 'dvb:probability';
    }
  }]);

  function Constants() {
    _classCallCheck(this, Constants);

    this.init();
  }

  return Constants;
})();

var constants = new Constants();
exports['default'] = constants;
module.exports = exports['default'];

},{}],66:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreEventsEventsBase = _dereq_(18);

var _coreEventsEventsBase2 = _interopRequireDefault(_coreEventsEventsBase);

var MetricsReportingEvents = (function (_EventsBase) {
  _inherits(MetricsReportingEvents, _EventsBase);

  function MetricsReportingEvents() {
    _classCallCheck(this, MetricsReportingEvents);

    _get(Object.getPrototypeOf(MetricsReportingEvents.prototype), 'constructor', this).call(this);

    this.METRICS_INITIALISATION_COMPLETE = 'internal_metricsReportingInitialized';
    this.BECAME_REPORTING_PLAYER = 'internal_becameReportingPlayer';

    /**
     * Triggered when CMCD data was generated for a HTTP request
     * @event MetricsReportingEvents#CMCD_DATA_GENERATED
     */
    this.CMCD_DATA_GENERATED = 'cmcdDataGenerated';
  }

  return MetricsReportingEvents;
})(_coreEventsEventsBase2['default']);

var metricsReportingEvents = new MetricsReportingEvents();
exports['default'] = metricsReportingEvents;
module.exports = exports['default'];

},{"18":18}],67:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreEventBus = _dereq_(10);

var _coreEventBus2 = _interopRequireDefault(_coreEventBus);

var _MediaPlayerEvents = _dereq_(64);

var _MediaPlayerEvents2 = _interopRequireDefault(_MediaPlayerEvents);

var _metricsMetricsReportingEvents = _dereq_(66);

var _metricsMetricsReportingEvents2 = _interopRequireDefault(_metricsMetricsReportingEvents);

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _coreDebug = _dereq_(9);

var _coreDebug2 = _interopRequireDefault(_coreDebug);

var _coreSettings = _dereq_(12);

var _coreSettings2 = _interopRequireDefault(_coreSettings);

var _streamingConstantsConstants = _dereq_(65);

var _streamingConstantsConstants2 = _interopRequireDefault(_streamingConstantsConstants);

var _voMetricsHTTPRequest = _dereq_(87);

var _dashModelsDashManifestModel = _dereq_(23);

var _dashModelsDashManifestModel2 = _interopRequireDefault(_dashModelsDashManifestModel);

var _coreUtils = _dereq_(13);

var _coreUtils2 = _interopRequireDefault(_coreUtils);

var CMCD_REQUEST_FIELD_NAME = 'CMCD';
var CMCD_VERSION = 1;
var OBJECT_TYPES = {
    MANIFEST: 'm',
    AUDIO: 'a',
    VIDEO: 'v',
    INIT: 'i',
    CAPTION: 'c',
    ISOBMFF_TEXT_TRACK: 'tt',
    ENCRYPTION_KEY: 'k',
    OTHER: 'o'
};
var STREAMING_FORMATS = {
    DASH: 'd',
    MSS: 's'
};
var STREAM_TYPES = {
    VOD: 'v',
    LIVE: 'l'
};
var RTP_SAFETY_FACTOR = 5;

function CmcdModel() {

    var logger = undefined,
        dashManifestModel = undefined,
        instance = undefined,
        internalData = undefined,
        abrController = undefined,
        dashMetrics = undefined,
        playbackController = undefined,
        streamProcessors = undefined,
        _isStartup = undefined,
        _bufferLevelStarved = undefined,
        _initialMediaRequestsDone = undefined;

    var context = this.context;
    var eventBus = (0, _coreEventBus2['default'])(context).getInstance();
    var settings = (0, _coreSettings2['default'])(context).getInstance();

    function setup() {
        logger = (0, _coreDebug2['default'])(context).getInstance().getLogger(instance);
        dashManifestModel = (0, _dashModelsDashManifestModel2['default'])(context).getInstance();

        _resetInitialSettings();
    }

    function initialize() {
        eventBus.on(_MediaPlayerEvents2['default'].PLAYBACK_RATE_CHANGED, _onPlaybackRateChanged, instance);
        eventBus.on(_MediaPlayerEvents2['default'].MANIFEST_LOADED, _onManifestLoaded, instance);
        eventBus.on(_MediaPlayerEvents2['default'].BUFFER_LEVEL_STATE_CHANGED, _onBufferLevelStateChanged, instance);
        eventBus.on(_MediaPlayerEvents2['default'].PLAYBACK_SEEKED, _onPlaybackSeeked, instance);
        eventBus.on(_MediaPlayerEvents2['default'].PERIOD_SWITCH_COMPLETED, _onPeriodSwitchComplete, instance);
    }

    function setConfig(config) {
        if (!config) return;

        if (config.abrController) {
            abrController = config.abrController;
        }

        if (config.dashMetrics) {
            dashMetrics = config.dashMetrics;
        }

        if (config.playbackController) {
            playbackController = config.playbackController;
        }
    }

    function _resetInitialSettings() {
        internalData = {
            pr: 1,
            nor: null,
            st: null,
            sf: null,
            sid: '' + _coreUtils2['default'].generateUuid(),
            cid: null
        };
        _bufferLevelStarved = {};
        _isStartup = {};
        _initialMediaRequestsDone = {};
        _updateStreamProcessors();
    }

    function _onPeriodSwitchComplete() {
        _updateStreamProcessors();
    }

    function _updateStreamProcessors() {
        if (!playbackController) return;
        var streamController = playbackController.getStreamController();
        if (!streamController) return;
        if (typeof streamController.getActiveStream !== 'function') return;
        var activeStream = streamController.getActiveStream();
        if (!activeStream) return;
        streamProcessors = activeStream.getProcessors();
    }

    function getQueryParameter(request) {
        try {
            if (settings.get().streaming.cmcd && settings.get().streaming.cmcd.enabled) {
                var cmcdData = _getCmcdData(request);
                var finalPayloadString = _buildFinalString(cmcdData);

                eventBus.trigger(_metricsMetricsReportingEvents2['default'].CMCD_DATA_GENERATED, {
                    url: request.url,
                    mediaType: request.mediaType,
                    cmcdData: cmcdData,
                    cmcdString: finalPayloadString
                });
                return {
                    key: CMCD_REQUEST_FIELD_NAME,
                    value: finalPayloadString
                };
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    function _getCmcdData(request) {
        try {
            var cmcdData = null;

            if (request.type === _voMetricsHTTPRequest.HTTPRequest.MPD_TYPE) {
                return _getCmcdDataForMpd(request);
            } else if (request.type === _voMetricsHTTPRequest.HTTPRequest.MEDIA_SEGMENT_TYPE) {
                _initForMediaType(request.mediaType);
                return _getCmcdDataForMediaSegment(request);
            } else if (request.type === _voMetricsHTTPRequest.HTTPRequest.INIT_SEGMENT_TYPE) {
                return _getCmcdDataForInitSegment(request);
            } else if (request.type === _voMetricsHTTPRequest.HTTPRequest.OTHER_TYPE || request.type === _voMetricsHTTPRequest.HTTPRequest.XLINK_EXPANSION_TYPE) {
                return _getCmcdDataForOther(request);
            } else if (request.type === _voMetricsHTTPRequest.HTTPRequest.LICENSE) {
                return _getCmcdDataForLicense(request);
            }

            return cmcdData;
        } catch (e) {
            return null;
        }
    }

    function _getCmcdDataForLicense(request) {
        var data = _getGenericCmcdData(request);

        data.ot = OBJECT_TYPES.ENCRYPTION_KEY;

        return data;
    }

    function _getCmcdDataForMpd() {
        var data = _getGenericCmcdData();

        data.ot = '' + OBJECT_TYPES.MANIFEST;

        return data;
    }

    function _getCmcdDataForMediaSegment(request) {
        var data = _getGenericCmcdData();
        var encodedBitrate = _getBitrateByRequest(request);
        var d = _getObjectDurationByRequest(request);
        var mtp = _getMeasuredThroughputByType(request.mediaType);
        var dl = _getDeadlineByType(request.mediaType);
        var bl = _getBufferLevelByType(request.mediaType);
        var tb = _getTopBitrateByType(request.mediaType);
        var pr = internalData.pr;

        var nextRequest = _probeNextRequest(request.mediaType);

        var ot = undefined;
        if (request.mediaType === _streamingConstantsConstants2['default'].VIDEO) ot = OBJECT_TYPES.VIDEO;
        if (request.mediaType === _streamingConstantsConstants2['default'].AUDIO) ot = OBJECT_TYPES.AUDIO;
        if (request.mediaType === _streamingConstantsConstants2['default'].FRAGMENTED_TEXT) {
            if (request.mediaInfo.mimeType === 'application/mp4') {
                ot = OBJECT_TYPES.ISOBMFF_TEXT_TRACK;
            } else {
                ot = OBJECT_TYPES.CAPTION;
            }
        }

        var rtp = settings.get().streaming.cmcd.rtp;
        if (!rtp) {
            rtp = _calculateRtp(request);
        }
        data.rtp = rtp;

        if (nextRequest) {
            if (request.url !== nextRequest.url) {
                var url = new URL(nextRequest.url);
                data.nor = url.pathname;
            } else if (nextRequest.range) {
                data.nrr = nextRequest.range;
            }
        }

        if (encodedBitrate) {
            data.br = encodedBitrate;
        }

        if (ot) {
            data.ot = ot;
        }

        if (!isNaN(d)) {
            data.d = d;
        }

        if (!isNaN(mtp)) {
            data.mtp = mtp;
        }

        if (!isNaN(dl)) {
            data.dl = dl;
        }

        if (!isNaN(bl)) {
            data.bl = bl;
        }

        if (!isNaN(tb)) {
            data.tb = tb;
        }

        if (!isNaN(pr) && pr !== 1) {
            data.pr = pr;
        }

        if (_bufferLevelStarved[request.mediaType]) {
            data.bs = true;
            _bufferLevelStarved[request.mediaType] = false;
        }

        if (_isStartup[request.mediaType] || !_initialMediaRequestsDone[request.mediaType]) {
            data.su = true;
            _isStartup[request.mediaType] = false;
            _initialMediaRequestsDone[request.mediaType] = true;
        }

        return data;
    }

    function _initForMediaType(mediaType) {

        if (!_initialMediaRequestsDone.hasOwnProperty(mediaType)) {
            _initialMediaRequestsDone[mediaType] = false;
        }

        if (!_isStartup.hasOwnProperty(mediaType)) {
            _isStartup[mediaType] = false;
        }

        if (!_bufferLevelStarved.hasOwnProperty(mediaType)) {
            _bufferLevelStarved[mediaType] = false;
        }
    }

    function _getCmcdDataForInitSegment() {
        var data = _getGenericCmcdData();

        data.ot = '' + OBJECT_TYPES.INIT;
        data.su = true;

        return data;
    }

    function _getCmcdDataForOther() {
        var data = _getGenericCmcdData();

        data.ot = '' + OBJECT_TYPES.OTHER;

        return data;
    }

    function _getGenericCmcdData() {
        var data = {};

        var cid = settings.get().streaming.cmcd.cid ? settings.get().streaming.cmcd.cid : internalData.cid;

        data.v = CMCD_VERSION;
        data.sid = settings.get().streaming.cmcd.sid ? settings.get().streaming.cmcd.sid : internalData.sid;

        data.sid = '' + data.sid;

        if (cid) {
            data.cid = '' + cid;
        }

        if (!isNaN(internalData.pr) && internalData.pr !== 1 && internalData.pr !== null) {
            data.pr = internalData.pr;
        }

        if (internalData.st) {
            data.st = internalData.st;
        }

        if (internalData.sf) {
            data.sf = internalData.sf;
        }

        return data;
    }

    function _getBitrateByRequest(request) {
        try {
            var quality = request.quality;
            var bitrateList = request.mediaInfo.bitrateList;

            return parseInt(bitrateList[quality].bandwidth / 1000);
        } catch (e) {
            return null;
        }
    }

    function _getTopBitrateByType(mediaType) {
        try {
            var info = abrController.getTopBitrateInfoFor(mediaType);
            return Math.round(info.bitrate / 1000);
        } catch (e) {
            return null;
        }
    }

    function _getObjectDurationByRequest(request) {
        try {
            return !isNaN(request.duration) ? Math.round(request.duration * 1000) : null;
        } catch (e) {
            return null;
        }
    }

    function _getMeasuredThroughputByType(mediaType) {
        try {
            return parseInt(abrController.getThroughputHistory().getSafeAverageThroughput(mediaType) / 100) * 100;
        } catch (e) {
            return null;
        }
    }

    function _getDeadlineByType(mediaType) {
        try {
            var playbackRate = internalData.pr;
            var bufferLevel = dashMetrics.getCurrentBufferLevel(mediaType);

            if (!isNaN(playbackRate) && !isNaN(bufferLevel)) {
                return parseInt(bufferLevel / playbackRate * 10) * 100;
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    function _getBufferLevelByType(mediaType) {
        try {
            var bufferLevel = dashMetrics.getCurrentBufferLevel(mediaType);

            if (!isNaN(bufferLevel)) {
                return parseInt(bufferLevel * 10) * 100;
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    function _onPlaybackRateChanged(data) {
        try {
            internalData.pr = data.playbackRate;
        } catch (e) {}
    }

    function _onManifestLoaded(data) {
        try {
            var isDynamic = dashManifestModel.getIsDynamic(data.data);
            var st = isDynamic ? '' + STREAM_TYPES.LIVE : '' + STREAM_TYPES.VOD;
            var sf = data.protocol && data.protocol === 'MSS' ? '' + STREAMING_FORMATS.MSS : '' + STREAMING_FORMATS.DASH;

            internalData.st = '' + st;
            internalData.sf = '' + sf;
        } catch (e) {}
    }

    function _onBufferLevelStateChanged(data) {
        try {
            if (data.state && data.mediaType) {
                if (data.state === _MediaPlayerEvents2['default'].BUFFER_EMPTY) {

                    if (!_bufferLevelStarved[data.mediaType]) {
                        _bufferLevelStarved[data.mediaType] = true;
                    }
                    if (!_isStartup[data.mediaType]) {
                        _isStartup[data.mediaType] = true;
                    }
                }
            }
        } catch (e) {}
    }

    function _onPlaybackSeeked() {
        for (var key in _bufferLevelStarved) {
            if (_bufferLevelStarved.hasOwnProperty(key)) {
                _bufferLevelStarved[key] = true;
            }
        }

        for (var key in _isStartup) {
            if (_isStartup.hasOwnProperty(key)) {
                _isStartup[key] = true;
            }
        }
    }

    function _buildFinalString(cmcdData) {
        try {
            var _ret = (function () {
                if (!cmcdData) {
                    return {
                        v: null
                    };
                }
                var keys = Object.keys(cmcdData).sort(function (a, b) {
                    return a.localeCompare(b);
                });
                var length = keys.length;

                var cmcdString = keys.reduce(function (acc, key, index) {
                    if (key === 'v' && cmcdData[key] === 1) return acc; // Version key should only be reported if it is != 1
                    if (typeof cmcdData[key] === 'string' && (key !== 'ot' || key !== 'sf' || key !== 'st')) {
                        var string = cmcdData[key].replace(/"/g, '\"');
                        acc += key + '="' + string + '"';
                    } else {
                        acc += key + '=' + cmcdData[key];
                    }
                    if (index < length - 1) {
                        acc += ',';
                    }

                    return acc;
                }, '');

                cmcdString = cmcdString.replace(/=true/g, '');

                return {
                    v: cmcdString
                };
            })();

            if (typeof _ret === 'object') return _ret.v;
        } catch (e) {
            return null;
        }
    }

    function _probeNextRequest(mediaType) {
        if (!streamProcessors || streamProcessors.length === 0) return;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = streamProcessors[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var streamProcessor = _step.value;

                if (streamProcessor.getType() === mediaType) {
                    return streamProcessor.probeNextRequest();
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator['return']) {
                    _iterator['return']();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    }

    function _calculateRtp(request) {
        // Get the values we need
        var playbackRate = playbackController.getPlaybackRate();
        if (!playbackRate) playbackRate = 1;
        var quality = request.quality;
        var mediaType = request.mediaType;
        var mediaInfo = request.mediaInfo;
        var duration = request.duration;

        var currentBufferLevel = _getBufferLevelByType(mediaType);
        if (currentBufferLevel === 0) currentBufferLevel = 500;
        var bitrate = mediaInfo.bitrateList[quality].bandwidth;

        // Calculate RTP
        var segmentSize = bitrate * duration / 1000; // Calculate file size in kilobits
        var timeToLoad = currentBufferLevel / playbackRate / 1000; // Calculate time available to load file in seconds
        var minBandwidth = segmentSize / timeToLoad; // Calculate the exact bandwidth required
        var rtpSafetyFactor = settings.get().streaming.cmcd.rtpSafetyFactor && !isNaN(settings.get().streaming.cmcd.rtpSafetyFactor) ? settings.get().streaming.cmcd.rtpSafetyFactor : RTP_SAFETY_FACTOR;
        var maxBandwidth = minBandwidth * rtpSafetyFactor; // Include a safety buffer

        var rtp = (parseInt(maxBandwidth / 100) + 1) * 100; // Round to the next multiple of 100

        return rtp;
    }

    function reset() {
        eventBus.off(_MediaPlayerEvents2['default'].PLAYBACK_RATE_CHANGED, _onPlaybackRateChanged, this);
        eventBus.off(_MediaPlayerEvents2['default'].MANIFEST_LOADED, _onManifestLoaded, this);
        eventBus.off(_MediaPlayerEvents2['default'].BUFFER_LEVEL_STATE_CHANGED, _onBufferLevelStateChanged, instance);
        eventBus.off(_MediaPlayerEvents2['default'].PLAYBACK_SEEKED, _onPlaybackSeeked, instance);

        _resetInitialSettings();
    }

    instance = {
        getQueryParameter: getQueryParameter,
        setConfig: setConfig,
        reset: reset,
        initialize: initialize
    };

    setup();

    return instance;
}

CmcdModel.__dashjs_factory_name = 'CmcdModel';
exports['default'] = _coreFactoryMaker2['default'].getSingletonFactory(CmcdModel);
module.exports = exports['default'];

},{"10":10,"11":11,"12":12,"13":13,"23":23,"64":64,"65":65,"66":66,"87":87,"9":9}],68:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _voFragmentRequest = _dereq_(82);

var _voFragmentRequest2 = _interopRequireDefault(_voFragmentRequest);

var FRAGMENT_MODEL_LOADING = 'loading';
var FRAGMENT_MODEL_EXECUTED = 'executed';
var FRAGMENT_MODEL_CANCELED = 'canceled';
var FRAGMENT_MODEL_FAILED = 'failed';

function FragmentModel(config) {

    config = config || {};
    var eventBus = config.eventBus;
    var events = config.events;
    var dashMetrics = config.dashMetrics;
    var fragmentLoader = config.fragmentLoader;
    var debug = config.debug;
    var streamInfo = config.streamInfo;
    var type = config.type;

    var instance = undefined,
        logger = undefined,
        executedRequests = undefined,
        loadingRequests = undefined;

    function setup() {
        logger = debug.getLogger(instance);
        resetInitialSettings();
        eventBus.on(events.LOADING_COMPLETED, onLoadingCompleted, instance);
        eventBus.on(events.LOADING_DATA_PROGRESS, onLoadingInProgress, instance);
        eventBus.on(events.LOADING_ABANDONED, onLoadingAborted, instance);
    }

    function getStreamId() {
        return streamInfo.id;
    }

    function getType() {
        return type;
    }

    function isFragmentLoaded(request) {
        var isEqualComplete = function isEqualComplete(req1, req2) {
            return req1.action === _voFragmentRequest2['default'].ACTION_COMPLETE && req1.action === req2.action;
        };

        var isEqualMedia = function isEqualMedia(req1, req2) {
            return !isNaN(req1.index) && req1.startTime === req2.startTime && req1.adaptationIndex === req2.adaptationIndex && req1.type === req2.type;
        };

        var isEqualInit = function isEqualInit(req1, req2) {
            return isNaN(req1.index) && isNaN(req2.index) && req1.quality === req2.quality;
        };

        var check = function check(requests) {
            var isLoaded = false;

            requests.some(function (req) {
                if (isEqualMedia(request, req) || isEqualInit(request, req) || isEqualComplete(request, req)) {
                    isLoaded = true;
                    return isLoaded;
                }
            });
            return isLoaded;
        };

        if (!request) {
            return false;
        }

        return check(executedRequests);
    }

    function isFragmentLoadedOrPending(request) {
        var isLoaded = false;
        var i = 0;
        var req = undefined;

        // First, check if the fragment has already been loaded
        isLoaded = isFragmentLoaded(request);

        // Then, check if the fragment is about to be loeaded
        if (!isLoaded) {
            for (i = 0; i < loadingRequests.length; i++) {
                req = loadingRequests[i];
                if (request.url === req.url && request.startTime === req.startTime) {
                    isLoaded = true;
                }
            }
        }

        return isLoaded;
    }

    /**
     *
     * Gets an array of {@link FragmentRequest} objects
     *
     * @param {Object} filter The object with properties by which the method filters the requests to be returned.
     *  the only mandatory property is state, which must be a value from
     *  other properties should match the properties of {@link FragmentRequest}. E.g.:
     *  getRequests({state: FragmentModel.FRAGMENT_MODEL_EXECUTED, quality: 0}) - returns
     *  all the requests from executedRequests array where requests.quality = filter.quality
     *
     * @returns {Array}
     * @memberof FragmentModel#
     */
    function getRequests(filter) {
        var states = filter ? filter.state instanceof Array ? filter.state : [filter.state] : [];

        var filteredRequests = [];
        states.forEach(function (state) {
            var requests = getRequestsForState(state);
            filteredRequests = filteredRequests.concat(filterRequests(requests, filter));
        });

        return filteredRequests;
    }

    function getRequestThreshold(req) {
        return isNaN(req.duration) ? 0.25 : Math.min(req.duration / 8, 0.5);
    }

    function removeExecutedRequestsBeforeTime(time) {
        executedRequests = executedRequests.filter(function (req) {
            var threshold = getRequestThreshold(req);
            return isNaN(req.startTime) || (time !== undefined ? req.startTime >= time - threshold : false);
        });
    }

    function removeExecutedRequestsAfterTime(time) {
        executedRequests = executedRequests.filter(function (req) {
            return isNaN(req.startTime) || (time !== undefined ? req.startTime < time : false);
        });
    }

    function removeExecutedRequestsInTimeRange(start, end) {
        if (end <= start + 0.5) {
            return;
        }

        executedRequests = executedRequests.filter(function (req) {
            var threshold = getRequestThreshold(req);
            return isNaN(req.startTime) || req.startTime >= end - threshold || isNaN(req.duration) || req.startTime + req.duration <= start + threshold;
        });
    }

    // Remove requests that are not "represented" by any of buffered ranges
    function syncExecutedRequestsWithBufferedRange(bufferedRanges, streamDuration) {
        if (!bufferedRanges || bufferedRanges.length === 0) {
            removeExecutedRequestsBeforeTime();
            return;
        }

        var start = 0;
        for (var i = 0, ln = bufferedRanges.length; i < ln; i++) {
            removeExecutedRequestsInTimeRange(start, bufferedRanges.start(i));
            start = bufferedRanges.end(i);
        }
        if (streamDuration > 0) {
            removeExecutedRequestsInTimeRange(start, streamDuration);
        }
    }

    function abortRequests() {
        logger.debug('abort requests');
        fragmentLoader.abort();
        loadingRequests = [];
    }

    function executeRequest(request) {
        switch (request.action) {
            case _voFragmentRequest2['default'].ACTION_COMPLETE:
                executedRequests.push(request);
                addSchedulingInfoMetrics(request, FRAGMENT_MODEL_EXECUTED);
                logger.debug('STREAM_COMPLETED');
                eventBus.trigger(events.STREAM_COMPLETED, { request: request }, { streamId: request.mediaInfo.streamInfo.id, mediaType: request.mediaType });
                break;
            case _voFragmentRequest2['default'].ACTION_DOWNLOAD:
                addSchedulingInfoMetrics(request, FRAGMENT_MODEL_LOADING);
                loadingRequests.push(request);
                loadCurrentFragment(request);
                break;
            default:
                logger.warn('Unknown request action.');
        }
    }

    function loadCurrentFragment(request) {
        eventBus.trigger(events.FRAGMENT_LOADING_STARTED, { request: request }, { streamId: streamInfo.id, mediaType: type });
        fragmentLoader.load(request);
    }

    function getRequestForTime(arr, time, threshold) {
        // loop through the executed requests and pick the one for which the playback interval matches the given time
        var lastIdx = arr.length - 1;
        for (var i = lastIdx; i >= 0; i--) {
            var req = arr[i];
            var start = req.startTime;
            var end = start + req.duration;
            threshold = !isNaN(threshold) ? threshold : getRequestThreshold(req);
            if (!isNaN(start) && !isNaN(end) && time + threshold >= start && time - threshold < end || isNaN(start) && isNaN(time)) {
                return req;
            }
        }
        return null;
    }

    function filterRequests(arr, filter) {
        // for time use a specific filtration function
        if (filter.hasOwnProperty('time')) {
            return [getRequestForTime(arr, filter.time, filter.threshold)];
        }

        return arr.filter(function (request) {
            for (var prop in filter) {
                if (prop === 'state') continue;
                if (filter.hasOwnProperty(prop) && request[prop] != filter[prop]) return false;
            }

            return true;
        });
    }

    function getRequestsForState(state) {
        var requests = undefined;
        switch (state) {
            case FRAGMENT_MODEL_LOADING:
                requests = loadingRequests;
                break;
            case FRAGMENT_MODEL_EXECUTED:
                requests = executedRequests;
                break;
            default:
                requests = [];
        }
        return requests;
    }

    function addSchedulingInfoMetrics(request, state) {
        dashMetrics.addSchedulingInfo(request, state);
        dashMetrics.addRequestsQueue(request.mediaType, loadingRequests, executedRequests);
    }

    function onLoadingCompleted(e) {
        if (e.sender !== fragmentLoader) return;

        loadingRequests.splice(loadingRequests.indexOf(e.request), 1);

        if (e.response && !e.error) {
            executedRequests.push(e.request);
        }

        addSchedulingInfoMetrics(e.request, e.error ? FRAGMENT_MODEL_FAILED : FRAGMENT_MODEL_EXECUTED);

        eventBus.trigger(events.FRAGMENT_LOADING_COMPLETED, {
            request: e.request,
            response: e.response,
            error: e.error,
            sender: this
        }, { streamId: streamInfo.id, mediaType: type });
    }

    function onLoadingInProgress(e) {
        if (e.sender !== fragmentLoader) return;

        eventBus.trigger(events.FRAGMENT_LOADING_PROGRESS, {
            request: e.request,
            response: e.response,
            error: e.error,
            sender: this
        }, { streamId: streamInfo.id, mediaType: type });
    }

    function onLoadingAborted(e) {
        if (e.sender !== fragmentLoader) return;

        eventBus.trigger(events.FRAGMENT_LOADING_ABANDONED, { request: e.request }, { streamId: streamInfo.id, mediaType: type });
    }

    function resetInitialSettings() {
        executedRequests = [];
        loadingRequests = [];
    }

    function reset() {
        eventBus.off(events.LOADING_COMPLETED, onLoadingCompleted, this);
        eventBus.off(events.LOADING_DATA_PROGRESS, onLoadingInProgress, this);
        eventBus.off(events.LOADING_ABANDONED, onLoadingAborted, this);

        if (fragmentLoader) {
            fragmentLoader.reset();
        }
        resetInitialSettings();
    }

    function addExecutedRequest(request) {
        executedRequests.push(request);
    }

    instance = {
        getStreamId: getStreamId,
        getType: getType,
        getRequests: getRequests,
        isFragmentLoaded: isFragmentLoaded,
        isFragmentLoadedOrPending: isFragmentLoadedOrPending,
        removeExecutedRequestsBeforeTime: removeExecutedRequestsBeforeTime,
        removeExecutedRequestsAfterTime: removeExecutedRequestsAfterTime,
        syncExecutedRequestsWithBufferedRange: syncExecutedRequestsWithBufferedRange,
        abortRequests: abortRequests,
        executeRequest: executeRequest,
        reset: reset,
        addExecutedRequest: addExecutedRequest
    };

    setup();
    return instance;
}

FragmentModel.__dashjs_factory_name = 'FragmentModel';
var factory = _coreFactoryMaker2['default'].getClassFactory(FragmentModel);
factory.FRAGMENT_MODEL_LOADING = FRAGMENT_MODEL_LOADING;
factory.FRAGMENT_MODEL_EXECUTED = FRAGMENT_MODEL_EXECUTED;
factory.FRAGMENT_MODEL_CANCELED = FRAGMENT_MODEL_CANCELED;
factory.FRAGMENT_MODEL_FAILED = FRAGMENT_MODEL_FAILED;
_coreFactoryMaker2['default'].updateClassFactory(FragmentModel.__dashjs_factory_name, factory);
exports['default'] = factory;
module.exports = exports['default'];

},{"11":11,"82":82}],69:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _coreSettings = _dereq_(12);

var _coreSettings2 = _interopRequireDefault(_coreSettings);

var _constantsConstants = _dereq_(65);

var _constantsConstants2 = _interopRequireDefault(_constantsConstants);

/**
 * @module FetchLoader
 * @ignore
 * @description Manages download of resources via HTTP using fetch.
 * @param {Object} cfg - dependencies from parent
 */
function FetchLoader(cfg) {

    cfg = cfg || {};
    var context = this.context;
    var requestModifier = cfg.requestModifier;
    var boxParser = cfg.boxParser;
    var settings = (0, _coreSettings2['default'])(context).getInstance();
    var instance = undefined;

    function load(httpRequest) {

        // Variables will be used in the callback functions
        var requestStartTime = new Date();
        var request = httpRequest.request;

        var headers = new Headers(); /*jshint ignore:line*/
        if (request.range) {
            headers.append('Range', 'bytes=' + request.range);
        }

        if (!request.requestStartDate) {
            request.requestStartDate = requestStartTime;
        }

        if (requestModifier) {
            // modifyRequestHeader expects a XMLHttpRequest object so,
            // to keep backward compatibility, we should expose a setRequestHeader method
            // TODO: Remove RequestModifier dependency on XMLHttpRequest object and define
            // a more generic way to intercept/modify requests
            requestModifier.modifyRequestHeader({
                setRequestHeader: function setRequestHeader(header, value) {
                    headers.append(header, value);
                }
            });
        }

        var abortController = undefined;
        if (typeof window.AbortController === 'function') {
            abortController = new AbortController(); /*jshint ignore:line*/
            httpRequest.abortController = abortController;
            abortController.signal.onabort = httpRequest.onabort;
        }

        var reqOptions = {
            method: httpRequest.method,
            headers: headers,
            credentials: httpRequest.withCredentials ? 'include' : undefined,
            signal: abortController ? abortController.signal : undefined
        };

        fetch(httpRequest.url, reqOptions).then(function (response) {
            if (!httpRequest.response) {
                httpRequest.response = {};
            }
            httpRequest.response.status = response.status;
            httpRequest.response.statusText = response.statusText;
            httpRequest.response.responseURL = response.url;

            if (!response.ok) {
                httpRequest.onerror();
            }

            var responseHeaders = '';
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = response.headers.keys()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var key = _step.value;

                    responseHeaders += key + ': ' + response.headers.get(key) + '\r\n';
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator['return']) {
                        _iterator['return']();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            httpRequest.response.responseHeaders = responseHeaders;

            if (!response.body) {
                // Fetch returning a ReadableStream response body is not currently supported by all browsers.
                // Browser compatibility: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
                // If it is not supported, returning the whole segment when it's ready (as xhr)
                return response.arrayBuffer().then(function (buffer) {
                    httpRequest.response.response = buffer;
                    var event = {
                        loaded: buffer.byteLength,
                        total: buffer.byteLength,
                        stream: false
                    };
                    httpRequest.progress(event);
                    httpRequest.onload();
                    httpRequest.onend();
                    return;
                });
            }

            var totalBytes = parseInt(response.headers.get('Content-Length'), 10);
            var bytesReceived = 0;
            var signaledFirstByte = false;
            var remaining = new Uint8Array();
            var offset = 0;

            httpRequest.reader = response.body.getReader();
            var downloadedData = [];
            var startTimeData = [];
            var endTimeData = [];
            var lastChunkWasFinished = true;
            var calculationMode = settings.get().streaming.abr.fetchThroughputCalculationMode;

            var processResult = function processResult(_ref) {
                var value = _ref.value;
                var done = _ref.done;
                // Bug fix Parse whenever data is coming [value] better than 1ms looking that increase CPU
                if (done) {
                    if (remaining) {
                        // If there is pending data, call progress so network metrics
                        // are correctly generated
                        // Same structure as https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequestEventTarget/
                        httpRequest.progress({
                            loaded: bytesReceived,
                            total: isNaN(totalBytes) ? bytesReceived : totalBytes,
                            lengthComputable: true,
                            time: calculateDownloadedTime(calculationMode, startTimeData, endTimeData, downloadedData, bytesReceived),
                            stream: true
                        });

                        httpRequest.response.response = remaining.buffer;
                    }
                    httpRequest.onload();
                    httpRequest.onend();
                    return;
                }

                if (value && value.length > 0) {
                    remaining = concatTypedArray(remaining, value);
                    bytesReceived += value.length;

                    downloadedData.push({
                        ts: Date.now(),
                        bytes: value.length
                    });

                    if (calculationMode === _constantsConstants2['default'].ABR_FETCH_THROUGHPUT_CALCULATION_MOOF_PARSING && lastChunkWasFinished) {
                        // Parse the payload and capture the the 'moof' box
                        var _boxesInfo = boxParser.findLastTopIsoBoxCompleted(['moof'], remaining, offset);
                        if (_boxesInfo.found) {
                            // Store the beginning time of each chunk download in array StartTimeData
                            lastChunkWasFinished = false;
                            startTimeData.push({
                                ts: performance.now(), /* jshint ignore:line */
                                bytes: value.length
                            });
                        }
                    }

                    var boxesInfo = boxParser.findLastTopIsoBoxCompleted(['moov', 'mdat'], remaining, offset);
                    if (boxesInfo.found) {
                        var end = boxesInfo.lastCompletedOffset + boxesInfo.size;

                        // Store the end time of each chunk download  with its size in array EndTimeData
                        if (calculationMode === _constantsConstants2['default'].ABR_FETCH_THROUGHPUT_CALCULATION_MOOF_PARSING) {
                            lastChunkWasFinished = true;
                            endTimeData.push({
                                ts: performance.now(), /* jshint ignore:line */
                                bytes: remaining.length
                            });
                        }

                        // If we are going to pass full buffer, avoid copying it and pass
                        // complete buffer. Otherwise clone the part of the buffer that is completed
                        // and adjust remaining buffer. A clone is needed because ArrayBuffer of a typed-array
                        // keeps a reference to the original data
                        var data = undefined;
                        if (end === remaining.length) {
                            data = remaining;
                            remaining = new Uint8Array();
                        } else {
                            data = new Uint8Array(remaining.subarray(0, end));
                            remaining = remaining.subarray(end);
                        }
                        // Announce progress but don't track traces. Throughput measures are quite unstable
                        // when they are based in small amount of data
                        httpRequest.progress({
                            data: data.buffer,
                            lengthComputable: false,
                            noTrace: true
                        });

                        offset = 0;
                    } else {
                        offset = boxesInfo.lastCompletedOffset;
                        // Call progress so it generates traces that will be later used to know when the first byte
                        // were received
                        if (!signaledFirstByte) {
                            httpRequest.progress({
                                lengthComputable: false,
                                noTrace: true
                            });
                            signaledFirstByte = true;
                        }
                    }
                }
                read(httpRequest, processResult);
            };
            read(httpRequest, processResult);
        })['catch'](function (e) {
            if (httpRequest.onerror) {
                httpRequest.onerror(e);
            }
        });
    }

    function read(httpRequest, processResult) {
        httpRequest.reader.read().then(processResult)['catch'](function (e) {
            if (httpRequest.onerror && httpRequest.response.status === 200) {
                // Error, but response code is 200, trigger error
                httpRequest.onerror(e);
            }
        });
    }

    function concatTypedArray(remaining, data) {
        if (remaining.length === 0) {
            return data;
        }
        var result = new Uint8Array(remaining.length + data.length);
        result.set(remaining);
        result.set(data, remaining.length);
        return result;
    }

    function abort(request) {
        if (request.abortController) {
            // For firefox and edge
            request.abortController.abort();
        } else if (request.reader) {
            // For Chrome
            try {
                request.reader.cancel();
                request.onabort();
            } catch (e) {
                // throw exceptions (TypeError) when reader was previously closed,
                // for example, because a network issue
            }
        }
    }

    // Compute the download time of a segment
    function calculateDownloadedTime(calculationMode, startTimeData, endTimeData, downloadedData, bytesReceived) {
        switch (calculationMode) {
            case _constantsConstants2['default'].ABR_FETCH_THROUGHPUT_CALCULATION_MOOF_PARSING:
                return _calculateDownloadedTimeByMoofParsing(startTimeData, endTimeData);
            case _constantsConstants2['default'].ABR_FETCH_THROUGHPUT_CALCULATION_DOWNLOADED_DATA:
                return _calculateDownloadedTimeByBytesReceived(downloadedData, bytesReceived);
            default:
                return _calculateDownloadedTimeByBytesReceived(downloadedData, bytesReceived);
        }
    }

    function _calculateDownloadedTimeByMoofParsing(startTimeData, endTimeData) {
        try {
            var datum = undefined,
                datumE = undefined;
            // Filter the first and last chunks in a segment in both arrays [StartTimeData and EndTimeData]
            datum = startTimeData.filter(function (data, i) {
                return i > 0 && i < startTimeData.length - 1;
            });
            datumE = endTimeData.filter(function (dataE, i) {
                return i > 0 && i < endTimeData.length - 1;
            });
            // Compute the download time of a segment based on the filtered data [last chunk end time - first chunk beginning time]
            var segDownloadTime = 0;
            if (datum.length > 1) {
                for (var i = 0; i < datum.length; i++) {
                    if (datum[i] && datumE[i]) {
                        var chunkDownladTime = datumE[i].ts - datum[i].ts;
                        segDownloadTime += chunkDownladTime;
                    }
                }

                return segDownloadTime;
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    function _calculateDownloadedTimeByBytesReceived(downloadedData, bytesReceived) {
        try {
            downloadedData = downloadedData.filter(function (data) {
                return data.bytes > bytesReceived / 4 / downloadedData.length;
            });
            if (downloadedData.length > 1) {
                var _ret = (function () {
                    var time = 0;
                    var avgTimeDistance = (downloadedData[downloadedData.length - 1].ts - downloadedData[0].ts) / downloadedData.length;
                    downloadedData.forEach(function (data, index) {
                        // To be counted the data has to be over a threshold
                        var next = downloadedData[index + 1];
                        if (next) {
                            var distance = next.ts - data.ts;
                            time += distance < avgTimeDistance ? distance : 0;
                        }
                    });
                    return {
                        v: time
                    };
                })();

                if (typeof _ret === 'object') return _ret.v;
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    instance = {
        load: load,
        abort: abort,
        calculateDownloadedTime: calculateDownloadedTime
    };

    return instance;
}

FetchLoader.__dashjs_factory_name = 'FetchLoader';

var factory = _coreFactoryMaker2['default'].getClassFactory(FetchLoader);
exports['default'] = factory;
module.exports = exports['default'];

},{"11":11,"12":12,"65":65}],70:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _XHRLoader = _dereq_(73);

var _XHRLoader2 = _interopRequireDefault(_XHRLoader);

var _FetchLoader = _dereq_(69);

var _FetchLoader2 = _interopRequireDefault(_FetchLoader);

var _voMetricsHTTPRequest = _dereq_(87);

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _voDashJSError = _dereq_(81);

var _voDashJSError2 = _interopRequireDefault(_voDashJSError);

var _modelsCmcdModel = _dereq_(67);

var _modelsCmcdModel2 = _interopRequireDefault(_modelsCmcdModel);

var _coreUtils = _dereq_(13);

var _coreUtils2 = _interopRequireDefault(_coreUtils);

var _coreDebug = _dereq_(9);

var _coreDebug2 = _interopRequireDefault(_coreDebug);

var _coreEventBus = _dereq_(10);

var _coreEventBus2 = _interopRequireDefault(_coreEventBus);

var _coreEventsEvents = _dereq_(17);

var _coreEventsEvents2 = _interopRequireDefault(_coreEventsEvents);

var _coreSettings = _dereq_(12);

var _coreSettings2 = _interopRequireDefault(_coreSettings);

/**
 * @module HTTPLoader
 * @ignore
 * @description Manages download of resources via HTTP.
 * @param {Object} cfg - dependancies from parent
 */
function HTTPLoader(cfg) {

    cfg = cfg || {};

    var context = this.context;
    var errHandler = cfg.errHandler;
    var dashMetrics = cfg.dashMetrics;
    var mediaPlayerModel = cfg.mediaPlayerModel;
    var requestModifier = cfg.requestModifier;
    var boxParser = cfg.boxParser;
    var useFetch = cfg.useFetch || false;
    var errors = cfg.errors;
    var requestTimeout = cfg.requestTimeout || 0;
    var eventBus = (0, _coreEventBus2['default'])(context).getInstance();
    var settings = (0, _coreSettings2['default'])(context).getInstance();

    var instance = undefined,
        requests = undefined,
        delayedRequests = undefined,
        retryRequests = undefined,
        downloadErrorToRequestTypeMap = undefined,
        cmcdModel = undefined,
        logger = undefined;

    function setup() {
        var _downloadErrorToRequestTypeMap;

        logger = (0, _coreDebug2['default'])(context).getInstance().getLogger(instance);
        requests = [];
        delayedRequests = [];
        retryRequests = [];
        cmcdModel = (0, _modelsCmcdModel2['default'])(context).getInstance();

        downloadErrorToRequestTypeMap = (_downloadErrorToRequestTypeMap = {}, _defineProperty(_downloadErrorToRequestTypeMap, _voMetricsHTTPRequest.HTTPRequest.MPD_TYPE, errors.DOWNLOAD_ERROR_ID_MANIFEST_CODE), _defineProperty(_downloadErrorToRequestTypeMap, _voMetricsHTTPRequest.HTTPRequest.XLINK_EXPANSION_TYPE, errors.DOWNLOAD_ERROR_ID_XLINK_CODE), _defineProperty(_downloadErrorToRequestTypeMap, _voMetricsHTTPRequest.HTTPRequest.INIT_SEGMENT_TYPE, errors.DOWNLOAD_ERROR_ID_INITIALIZATION_CODE), _defineProperty(_downloadErrorToRequestTypeMap, _voMetricsHTTPRequest.HTTPRequest.MEDIA_SEGMENT_TYPE, errors.DOWNLOAD_ERROR_ID_CONTENT_CODE), _defineProperty(_downloadErrorToRequestTypeMap, _voMetricsHTTPRequest.HTTPRequest.INDEX_SEGMENT_TYPE, errors.DOWNLOAD_ERROR_ID_CONTENT_CODE), _defineProperty(_downloadErrorToRequestTypeMap, _voMetricsHTTPRequest.HTTPRequest.BITSTREAM_SWITCHING_SEGMENT_TYPE, errors.DOWNLOAD_ERROR_ID_CONTENT_CODE), _defineProperty(_downloadErrorToRequestTypeMap, _voMetricsHTTPRequest.HTTPRequest.OTHER_TYPE, errors.DOWNLOAD_ERROR_ID_CONTENT_CODE), _downloadErrorToRequestTypeMap);
    }

    function internalLoad(config, remainingAttempts) {
        var request = config.request;
        var traces = [];
        var firstProgress = true;
        var needFailureReport = true;
        var requestStartTime = new Date();
        var lastTraceTime = requestStartTime;
        var lastTraceReceivedCount = 0;
        var httpRequest = undefined;

        if (!requestModifier || !dashMetrics || !errHandler) {
            throw new Error('config object is not correct or missing');
        }

        var handleLoaded = function handleLoaded(success) {
            needFailureReport = false;

            request.requestStartDate = requestStartTime;
            request.requestEndDate = new Date();
            request.firstByteDate = request.firstByteDate || requestStartTime;

            if (!request.checkExistenceOnly) {
                dashMetrics.addHttpRequest(request, httpRequest.response ? httpRequest.response.responseURL : null, httpRequest.response ? httpRequest.response.status : null, httpRequest.response && httpRequest.response.getAllResponseHeaders ? httpRequest.response.getAllResponseHeaders() : httpRequest.response ? httpRequest.response.responseHeaders : [], success ? traces : null);

                if (request.type === _voMetricsHTTPRequest.HTTPRequest.MPD_TYPE) {
                    dashMetrics.addManifestUpdate(request);
                }
            }
        };

        var onloadend = function onloadend() {
            if (requests.indexOf(httpRequest) === -1) {
                return;
            } else {
                requests.splice(requests.indexOf(httpRequest), 1);
            }

            if (needFailureReport) {
                handleLoaded(false);

                if (remainingAttempts > 0) {
                    (function () {

                        // If we get a 404 to a media segment we should check the client clock again and perform a UTC sync in the background.
                        try {
                            if (settings.get().streaming.utcSynchronization.enableBackgroundSyncAfterSegmentDownloadError && request.type === _voMetricsHTTPRequest.HTTPRequest.MEDIA_SEGMENT_TYPE) {
                                // Only trigger a sync if the loading failed for the first time
                                var initialNumberOfAttempts = mediaPlayerModel.getRetryAttemptsForType(_voMetricsHTTPRequest.HTTPRequest.MEDIA_SEGMENT_TYPE);
                                if (initialNumberOfAttempts === remainingAttempts) {
                                    eventBus.trigger(_coreEventsEvents2['default'].ATTEMPT_BACKGROUND_SYNC);
                                }
                            }
                        } catch (e) {}

                        remainingAttempts--;
                        var retryRequest = { config: config };
                        retryRequests.push(retryRequest);
                        retryRequest.timeout = setTimeout(function () {
                            if (retryRequests.indexOf(retryRequest) === -1) {
                                return;
                            } else {
                                retryRequests.splice(retryRequests.indexOf(retryRequest), 1);
                            }
                            internalLoad(config, remainingAttempts);
                        }, mediaPlayerModel.getRetryIntervalsForType(request.type));
                    })();
                } else {
                    errHandler.error(new _voDashJSError2['default'](downloadErrorToRequestTypeMap[request.type], request.url + ' is not available', {
                        request: request,
                        response: httpRequest.response
                    }));

                    if (config.error) {
                        config.error(request, 'error', httpRequest.response.statusText);
                    }

                    if (config.complete) {
                        config.complete(request, httpRequest.response.statusText);
                    }
                }
            }
        };

        var progress = function progress(event) {
            var currentTime = new Date();

            if (firstProgress) {
                firstProgress = false;
                if (!event.lengthComputable || event.lengthComputable && event.total !== event.loaded) {
                    request.firstByteDate = currentTime;
                }
            }

            if (event.lengthComputable) {
                request.bytesLoaded = event.loaded;
                request.bytesTotal = event.total;
            }

            if (!event.noTrace) {
                traces.push({
                    s: lastTraceTime,
                    d: event.time ? event.time : currentTime.getTime() - lastTraceTime.getTime(),
                    b: [event.loaded ? event.loaded - lastTraceReceivedCount : 0]
                });

                lastTraceTime = currentTime;
                lastTraceReceivedCount = event.loaded;
            }

            if (config.progress && event) {
                config.progress(event);
            }
        };

        var onload = function onload() {
            if (httpRequest.response.status >= 200 && httpRequest.response.status <= 299) {
                handleLoaded(true);

                if (config.success) {
                    config.success(httpRequest.response.response, httpRequest.response.statusText, httpRequest.response.responseURL);
                }

                if (config.complete) {
                    config.complete(request, httpRequest.response.statusText);
                }
            }
        };

        var onabort = function onabort() {
            if (config.abort) {
                config.abort(request);
            }
        };

        var ontimeout = function ontimeout(event) {
            var timeoutMessage = undefined;
            if (event.lengthComputable) {
                var percentageComplete = event.loaded / event.total * 100;
                timeoutMessage = 'Request timeout: loaded: ' + event.loaded + ', out of: ' + event.total + ' : ' + percentageComplete.toFixed(3) + '% Completed';
            } else {
                timeoutMessage = 'Request timeout: non-computable download size';
            }
            logger.warn(timeoutMessage);
        };

        var loader = undefined;
        if (useFetch && window.fetch && request.responseType === 'arraybuffer' && request.type === _voMetricsHTTPRequest.HTTPRequest.MEDIA_SEGMENT_TYPE) {
            loader = (0, _FetchLoader2['default'])(context).create({
                requestModifier: requestModifier,
                boxParser: boxParser
            });
        } else {
            loader = (0, _XHRLoader2['default'])(context).create({
                requestModifier: requestModifier
            });
        }

        var modifiedUrl = requestModifier.modifyRequestURL(request.url);
        var additionalQueryParameter = _getAdditionalQueryParameter(request);
        modifiedUrl = _coreUtils2['default'].addAditionalQueryParameterToUrl(modifiedUrl, additionalQueryParameter);
        var verb = request.checkExistenceOnly ? _voMetricsHTTPRequest.HTTPRequest.HEAD : _voMetricsHTTPRequest.HTTPRequest.GET;
        var withCredentials = mediaPlayerModel.getXHRWithCredentialsForType(request.type);

        httpRequest = {
            url: modifiedUrl,
            method: verb,
            withCredentials: withCredentials,
            request: request,
            onload: onload,
            onend: onloadend,
            onerror: onloadend,
            progress: progress,
            onabort: onabort,
            ontimeout: ontimeout,
            loader: loader,
            timeout: requestTimeout
        };

        // Adds the ability to delay single fragment loading time to control buffer.
        var now = new Date().getTime();
        if (isNaN(request.delayLoadingTime) || now >= request.delayLoadingTime) {
            // no delay - just send
            requests.push(httpRequest);
            loader.load(httpRequest);
        } else {
            (function () {
                // delay
                var delayedRequest = { httpRequest: httpRequest };
                delayedRequests.push(delayedRequest);
                delayedRequest.delayTimeout = setTimeout(function () {
                    if (delayedRequests.indexOf(delayedRequest) === -1) {
                        return;
                    } else {
                        delayedRequests.splice(delayedRequests.indexOf(delayedRequest), 1);
                    }
                    try {
                        requestStartTime = new Date();
                        lastTraceTime = requestStartTime;
                        requests.push(delayedRequest.httpRequest);
                        loader.load(delayedRequest.httpRequest);
                    } catch (e) {
                        delayedRequest.httpRequest.onerror();
                    }
                }, request.delayLoadingTime - now);
            })();
        }
    }

    function _getAdditionalQueryParameter(request) {
        try {
            var additionalQueryParameter = [];
            var cmcdQueryParameter = cmcdModel.getQueryParameter(request);

            if (cmcdQueryParameter) {
                additionalQueryParameter.push(cmcdQueryParameter);
            }

            return additionalQueryParameter;
        } catch (e) {
            return [];
        }
    }

    /**
     * Initiates a download of the resource described by config.request
     * @param {Object} config - contains request (FragmentRequest or derived type), and callbacks
     * @memberof module:HTTPLoader
     * @instance
     */
    function load(config) {
        if (config.request) {
            internalLoad(config, mediaPlayerModel.getRetryAttemptsForType(config.request.type));
        } else {
            if (config.error) {
                config.error(config.request, 'error');
            }
        }
    }

    /**
     * Aborts any inflight downloads
     * @memberof module:HTTPLoader
     * @instance
     */
    function abort() {
        retryRequests.forEach(function (t) {
            clearTimeout(t.timeout);
            // abort request in order to trigger LOADING_ABANDONED event
            if (t.config.request && t.config.abort) {
                t.config.abort(t.config.request);
            }
        });
        retryRequests = [];

        delayedRequests.forEach(function (x) {
            return clearTimeout(x.delayTimeout);
        });
        delayedRequests = [];

        requests.forEach(function (x) {
            // abort will trigger onloadend which we don't want
            // when deliberately aborting inflight requests -
            // set them to undefined so they are not called
            x.onloadend = x.onerror = x.onprogress = undefined;
            x.loader.abort(x);
        });
        requests = [];
    }

    instance = {
        load: load,
        abort: abort
    };

    setup();

    return instance;
}

HTTPLoader.__dashjs_factory_name = 'HTTPLoader';

var factory = _coreFactoryMaker2['default'].getClassFactory(HTTPLoader);
exports['default'] = factory;
module.exports = exports['default'];

},{"10":10,"11":11,"12":12,"13":13,"17":17,"67":67,"69":69,"73":73,"81":81,"87":87,"9":9}],71:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _streamingNetHTTPLoader = _dereq_(70);

var _streamingNetHTTPLoader2 = _interopRequireDefault(_streamingNetHTTPLoader);

/**
 * @module
 * @description Choose right url loader for scheme
 * @ignore
 */
function SchemeLoaderFactory() {

    var instance = undefined;

    var schemeLoaderMap = undefined;

    function registerLoader(scheme, loader) {
        schemeLoaderMap[scheme] = loader;
    }

    function unregisterLoader(scheme) {
        if (schemeLoaderMap[scheme]) {
            delete schemeLoaderMap[scheme];
        }
    }

    function unregisterAllLoader() {
        schemeLoaderMap = {};
    }

    function getLoader(url) {

        // iterates through schemeLoaderMap to find a loader for the scheme
        for (var scheme in schemeLoaderMap) {
            if (schemeLoaderMap.hasOwnProperty(scheme) && url.startsWith(scheme)) {
                return schemeLoaderMap[scheme];
            }
        }

        return _streamingNetHTTPLoader2['default'];
    }

    function reset() {
        unregisterAllLoader();
    }

    function setup() {
        reset();
    }

    setup();

    instance = {
        getLoader: getLoader,
        registerLoader: registerLoader,
        unregisterLoader: unregisterLoader,
        unregisterAllLoader: unregisterAllLoader,
        reset: reset
    };

    return instance;
}

SchemeLoaderFactory.__dashjs_factory_name = 'SchemeLoaderFactory';
var factory = _coreFactoryMaker2['default'].getSingletonFactory(SchemeLoaderFactory);
exports['default'] = factory;
module.exports = exports['default'];

},{"11":11,"70":70}],72:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _streamingNetSchemeLoaderFactory = _dereq_(71);

var _streamingNetSchemeLoaderFactory2 = _interopRequireDefault(_streamingNetSchemeLoaderFactory);

/**
 * @class URLLoader
 * @description  Call Offline Loader or Online Loader dependaing on URL
 * @param {Object} cfg - dependances
 * @ignore
*/
function URLLoader(cfg) {

    cfg = cfg || {};
    var context = this.context;

    var instance = undefined,
        schemeLoaderFactory = undefined,
        loader = undefined;

    schemeLoaderFactory = (0, _streamingNetSchemeLoaderFactory2['default'])(context).getInstance();

    function load(config) {

        var loaderFactory = schemeLoaderFactory.getLoader(config && config.request ? config.request.url : null);
        loader = loaderFactory(context).create({
            errHandler: cfg.errHandler,
            mediaPlayerModel: cfg.mediaPlayerModel,
            requestModifier: cfg.requestModifier,
            useFetch: cfg.useFetch || null,
            dashMetrics: cfg.dashMetrics,
            boxParser: cfg.boxParser ? cfg.boxParser : null,
            constants: cfg.constants ? cfg.constants : null,
            dashConstants: cfg.dashConstants ? cfg.dashConstants : null,
            urlUtils: cfg.urlUtils ? cfg.urlUtils : null,
            requestTimeout: !isNaN(cfg.requestTimeout) ? cfg.requestTimeout : 0,
            errors: cfg.errors
        });

        loader.load(config);
    }

    function abort() {
        if (loader) {
            loader.abort();
        }
    }
    instance = {
        load: load,
        abort: abort
    };

    return instance;
}
URLLoader.__dashjs_factory_name = 'URLLoader';

var factory = _coreFactoryMaker2['default'].getClassFactory(URLLoader);
exports['default'] = factory;
module.exports = exports['default'];

},{"11":11,"71":71}],73:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

/**
 * @module XHRLoader
 * @ignore
 * @description Manages download of resources via HTTP.
 * @param {Object} cfg - dependencies from parent
 */
function XHRLoader(cfg) {

    cfg = cfg || {};
    var requestModifier = cfg.requestModifier;

    var instance = undefined;

    function load(httpRequest) {

        // Variables will be used in the callback functions
        var requestStartTime = new Date();
        var request = httpRequest.request;

        var xhr = new XMLHttpRequest();
        xhr.open(httpRequest.method, httpRequest.url, true);

        if (request.responseType) {
            xhr.responseType = request.responseType;
        }

        if (request.range) {
            xhr.setRequestHeader('Range', 'bytes=' + request.range);
        }

        if (!request.requestStartDate) {
            request.requestStartDate = requestStartTime;
        }

        if (requestModifier) {
            xhr = requestModifier.modifyRequestHeader(xhr);
        }

        xhr.withCredentials = httpRequest.withCredentials;

        xhr.onload = httpRequest.onload;
        xhr.onloadend = httpRequest.onend;
        xhr.onerror = httpRequest.onerror;
        xhr.onprogress = httpRequest.progress;
        xhr.onabort = httpRequest.onabort;
        xhr.ontimeout = httpRequest.ontimeout;
        xhr.timeout = httpRequest.timeout;

        xhr.send();

        httpRequest.response = xhr;
    }

    function abort(request) {
        var x = request.response;
        x.onloadend = x.onerror = x.onprogress = undefined; //Ignore events from aborted requests.
        x.abort();
    }

    instance = {
        load: load,
        abort: abort
    };

    return instance;
}

XHRLoader.__dashjs_factory_name = 'XHRLoader';

var factory = _coreFactoryMaker2['default'].getClassFactory(XHRLoader);
exports['default'] = factory;
module.exports = exports['default'];

},{"11":11}],74:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _constantsConstants = _dereq_(65);

var _constantsConstants2 = _interopRequireDefault(_constantsConstants);

var _dashConstantsDashConstants = _dereq_(20);

var _dashConstantsDashConstants2 = _interopRequireDefault(_dashConstantsDashConstants);

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _voThumbnailTrackInfo = _dereq_(86);

var _voThumbnailTrackInfo2 = _interopRequireDefault(_voThumbnailTrackInfo);

var _streamingUtilsURLUtils = _dereq_(80);

var _streamingUtilsURLUtils2 = _interopRequireDefault(_streamingUtilsURLUtils);

var _dashUtilsSegmentsUtils = _dereq_(37);

var _coreEventsEvents = _dereq_(17);

var _coreEventsEvents2 = _interopRequireDefault(_coreEventsEvents);

var _streamingUtilsBoxParser = _dereq_(75);

var _streamingUtilsBoxParser2 = _interopRequireDefault(_streamingUtilsBoxParser);

var _streamingNetXHRLoader = _dereq_(73);

var _streamingNetXHRLoader2 = _interopRequireDefault(_streamingNetXHRLoader);

var _dashDashHandler = _dereq_(19);

var _dashDashHandler2 = _interopRequireDefault(_dashDashHandler);

var THUMBNAILS_SCHEME_ID_URIS = ['http://dashif.org/thumbnail_tile', 'http://dashif.org/guidelines/thumbnail_tile'];

exports.THUMBNAILS_SCHEME_ID_URIS = THUMBNAILS_SCHEME_ID_URIS;
function ThumbnailTracks(config) {
    var context = this.context;
    var adapter = config.adapter;
    var baseURLController = config.baseURLController;
    var streamInfo = config.streamInfo;
    var timelineConverter = config.timelineConverter;
    var debug = config.debug;
    var eventBus = config.eventBus;
    var events = config.events;
    var dashConstants = config.dashConstants;

    var urlUtils = (0, _streamingUtilsURLUtils2['default'])(context).getInstance();

    var instance = undefined,
        tracks = undefined,
        indexHandler = undefined,
        currentTrackIndex = undefined,
        mediaInfo = undefined,
        loader = undefined,
        boxParser = undefined;

    function initialize() {
        reset();
        loader = (0, _streamingNetXHRLoader2['default'])(context).create({});
        boxParser = (0, _streamingUtilsBoxParser2['default'])(context).getInstance();

        indexHandler = (0, _dashDashHandler2['default'])(context).create({
            streamInfo: streamInfo,
            timelineConverter: timelineConverter,
            baseURLController: baseURLController,
            debug: debug,
            eventBus: eventBus,
            events: events,
            dashConstants: dashConstants,
            urlUtils: urlUtils
        });

        // initialize controllers
        indexHandler.initialize(adapter ? adapter.getIsDynamic() : false);

        // parse representation and create tracks
        addTracks();
    }

    function normalizeSegments(fragments, representation) {
        var segments = [];
        var count = 0;

        var i = undefined,
            len = undefined,
            s = undefined,
            seg = undefined;

        for (i = 0, len = fragments.length; i < len; i++) {
            s = fragments[i];

            seg = (0, _dashUtilsSegmentsUtils.getTimeBasedSegment)(timelineConverter, adapter.getIsDynamic(), representation, s.startTime, s.duration, s.timescale, s.media, s.mediaRange, count);

            if (seg) {
                segments.push(seg);
                seg = null;
                count++;
            }
        }
        return segments;
    }

    function addTracks() {
        if (!streamInfo || !adapter) {
            return;
        }

        // Extract thumbnail tracks
        mediaInfo = adapter.getMediaInfoForType(streamInfo, _constantsConstants2['default'].IMAGE);
        if (!mediaInfo) {
            return;
        }

        var voReps = adapter.getVoRepresentations(mediaInfo);

        if (voReps && voReps.length > 0) {
            voReps.forEach(function (rep) {
                if (rep.segmentInfoType === _dashConstantsDashConstants2['default'].SEGMENT_TEMPLATE && rep.segmentDuration > 0 && rep.media || rep.segmentInfoType === _dashConstantsDashConstants2['default'].SEGMENT_TIMELINE) {
                    createTrack(rep);
                }
                if (rep.segmentInfoType === _dashConstantsDashConstants2['default'].SEGMENT_BASE) {
                    createTrack(rep, true);
                }
            });
        }

        if (tracks.length > 0) {
            // Sort bitrates and select the lowest bitrate rendition
            tracks.sort(function (a, b) {
                return a.bitrate - b.bitrate;
            });
            currentTrackIndex = tracks.length - 1;
        }
    }

    function createTrack(representation, useSegmentBase) {
        var track = new _voThumbnailTrackInfo2['default']();
        track.id = representation.id;
        track.bitrate = representation.bandwidth;
        track.width = representation.width;
        track.height = representation.height;
        track.tilesHor = 1;
        track.tilesVert = 1;

        if (representation.essentialProperties) {
            representation.essentialProperties.forEach(function (p) {
                if (THUMBNAILS_SCHEME_ID_URIS.indexOf(p.schemeIdUri) >= 0 && p.value) {
                    var vars = p.value.split('x');
                    if (vars.length === 2 && !isNaN(vars[0]) && !isNaN(vars[1])) {
                        track.tilesHor = parseInt(vars[0], 10);
                        track.tilesVert = parseInt(vars[1], 10);
                    }
                }
            });
        }

        if (useSegmentBase) {
            eventBus.trigger(_coreEventsEvents2['default'].SEGMENTBASE_SEGMENTSLIST_REQUEST_NEEDED, {
                streamId: streamInfo.id,
                mediaType: _constantsConstants2['default'].IMAGE,
                mimeType: mediaInfo.mimeType,
                representation: representation,
                callback: function callback(streamId, mediaType, segments, representation) {
                    var cache = [];
                    segments = normalizeSegments(segments, representation);
                    track.segmentDuration = segments[0].duration; //assume all segments have the same duration
                    track.readThumbnail = function (time, callback) {

                        var cached = null;
                        cache.some(function (el) {
                            if (el.start <= time && el.end > time) {
                                cached = el.url;
                                return true;
                            }
                        });
                        if (cached) {
                            callback(cached);
                        } else {
                            segments.some(function (ss) {
                                if (ss.mediaStartTime <= time && ss.mediaStartTime + ss.duration > time) {
                                    var baseURL = baseURLController.resolve(representation.path);
                                    loader.load({
                                        method: 'get',
                                        url: baseURL.url,
                                        request: {
                                            range: ss.mediaRange,
                                            responseType: 'arraybuffer'
                                        },
                                        onload: function onload(e) {
                                            var info = boxParser.getSamplesInfo(e.target.response);
                                            var blob = new Blob([e.target.response.slice(info.sampleList[0].offset, info.sampleList[0].offset + info.sampleList[0].size)], { type: 'image/jpeg' });
                                            var imageUrl = window.URL.createObjectURL(blob);
                                            cache.push({
                                                start: ss.mediaStartTime,
                                                end: ss.mediaStartTime + ss.duration,
                                                url: imageUrl
                                            });
                                            if (callback) callback(imageUrl);
                                        }
                                    });
                                    return true;
                                }
                            });
                        }
                    };
                }
            });
        } else {
            track.startNumber = representation.startNumber;
            track.segmentDuration = representation.segmentDuration;
            track.timescale = representation.timescale;
            track.templateUrl = buildTemplateUrl(representation);
        }

        if (track.tilesHor > 0 && track.tilesVert > 0) {
            // Precalculate width and heigth per tile for perf reasons
            track.widthPerTile = track.width / track.tilesHor;
            track.heightPerTile = track.height / track.tilesVert;
            tracks.push(track);
        }
    }

    function buildTemplateUrl(representation) {
        var templateUrl = urlUtils.isRelative(representation.media) ? urlUtils.resolve(representation.media, baseURLController.resolve(representation.path).url) : representation.media;

        if (!templateUrl) {
            return '';
        }

        return (0, _dashUtilsSegmentsUtils.replaceIDForTemplate)(templateUrl, representation.id);
    }

    function getTracks() {
        return tracks;
    }

    function getCurrentTrackIndex() {
        return currentTrackIndex;
    }

    function getCurrentTrack() {
        if (currentTrackIndex < 0) {
            return null;
        }
        return tracks[currentTrackIndex];
    }

    function setTrackByIndex(index) {
        if (!tracks || tracks.length === 0) {
            return;
        }
        // select highest bitrate in case selected index is higher than bitrate list length
        if (index >= tracks.length) {
            index = tracks.length - 1;
        }
        currentTrackIndex = index;
    }

    function getThumbnailRequestForTime(time) {
        var currentVoRep = undefined;
        var voReps = adapter.getVoRepresentations(mediaInfo);
        for (var i = 0; i < voReps.length; i++) {
            if (tracks[currentTrackIndex].id === voReps[i].id) {
                currentVoRep = voReps[i];
                break;
            }
        }

        return indexHandler.getSegmentRequestForTime(mediaInfo, currentVoRep, time);
    }

    function reset() {
        tracks = [];
        currentTrackIndex = -1;
        mediaInfo = null;
    }

    instance = {
        initialize: initialize,
        getTracks: getTracks,
        reset: reset,
        setTrackByIndex: setTrackByIndex,
        getCurrentTrack: getCurrentTrack,
        getCurrentTrackIndex: getCurrentTrackIndex,
        getThumbnailRequestForTime: getThumbnailRequestForTime
    };

    initialize();

    return instance;
}

ThumbnailTracks.__dashjs_factory_name = 'ThumbnailTracks';
exports['default'] = _coreFactoryMaker2['default'].getClassFactory(ThumbnailTracks);

},{"11":11,"17":17,"19":19,"20":20,"37":37,"65":65,"73":73,"75":75,"80":80,"86":86}],75:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreDebug = _dereq_(9);

var _coreDebug2 = _interopRequireDefault(_coreDebug);

var _IsoFile = _dereq_(77);

var _IsoFile2 = _interopRequireDefault(_IsoFile);

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _codemIsoboxer = _dereq_(2);

var _codemIsoboxer2 = _interopRequireDefault(_codemIsoboxer);

var _voIsoBoxSearchInfo = _dereq_(85);

var _voIsoBoxSearchInfo2 = _interopRequireDefault(_voIsoBoxSearchInfo);

function BoxParser() /*config*/{

    var logger = undefined,
        instance = undefined;
    var context = this.context;

    function setup() {
        logger = (0, _coreDebug2['default'])(context).getInstance().getLogger(instance);
    }

    /**
     * @param {ArrayBuffer} data
     * @returns {IsoFile|null}
     * @memberof BoxParser#
     */
    function parse(data) {
        if (!data) return null;

        if (data.fileStart === undefined) {
            data.fileStart = 0;
        }

        var parsedFile = _codemIsoboxer2['default'].parseBuffer(data);
        var dashIsoFile = (0, _IsoFile2['default'])(context).create();

        dashIsoFile.setData(parsedFile);

        return dashIsoFile;
    }

    /**
     * From the list of type boxes to look for, returns the latest one that is fully completed (header + payload). This
     * method only looks into the list of top boxes and doesn't analyze nested boxes.
     * @param {string[]} types
     * @param {ArrayBuffer|uint8Array} buffer
     * @param {number} offset
     * @returns {IsoBoxSearchInfo}
     * @memberof BoxParser#
     */
    function findLastTopIsoBoxCompleted(types, buffer, offset) {
        if (offset === undefined) {
            offset = 0;
        }

        // 8 = size (uint32) + type (4 characters)
        if (!buffer || offset + 8 >= buffer.byteLength) {
            return new _voIsoBoxSearchInfo2['default'](0, false);
        }

        var data = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
        var boxInfo = undefined;
        var lastCompletedOffset = 0;
        while (offset < data.byteLength) {
            var boxSize = parseUint32(data, offset);
            var boxType = parseIsoBoxType(data, offset + 4);

            if (boxSize === 0) {
                break;
            }

            if (offset + boxSize <= data.byteLength) {
                if (types.indexOf(boxType) >= 0) {
                    boxInfo = new _voIsoBoxSearchInfo2['default'](offset, true, boxSize);
                } else {
                    lastCompletedOffset = offset + boxSize;
                }
            }

            offset += boxSize;
        }

        if (!boxInfo) {
            return new _voIsoBoxSearchInfo2['default'](lastCompletedOffset, false);
        }

        return boxInfo;
    }

    function getSamplesInfo(ab) {
        if (!ab || ab.byteLength === 0) {
            return { sampleList: [], lastSequenceNumber: NaN, totalDuration: NaN, numSequences: NaN };
        }
        var isoFile = parse(ab);
        // zero or more moofs
        var moofBoxes = isoFile.getBoxes('moof');
        // exactly one mfhd per moof
        var mfhdBoxes = isoFile.getBoxes('mfhd');

        var sampleDuration = undefined,
            sampleCompositionTimeOffset = undefined,
            sampleCount = undefined,
            sampleSize = undefined,
            sampleDts = undefined,
            sampleList = undefined,
            sample = undefined,
            i = undefined,
            j = undefined,
            k = undefined,
            l = undefined,
            m = undefined,
            n = undefined,
            dataOffset = undefined,
            lastSequenceNumber = undefined,
            numSequences = undefined,
            totalDuration = undefined;

        numSequences = isoFile.getBoxes('moof').length;
        lastSequenceNumber = mfhdBoxes[mfhdBoxes.length - 1].sequence_number;
        sampleCount = 0;

        sampleList = [];
        var subsIndex = -1;
        var nextSubsSample = -1;
        for (l = 0; l < moofBoxes.length; l++) {
            var moofBox = moofBoxes[l];
            // zero or more trafs per moof
            var trafBoxes = moofBox.getChildBoxes('traf');
            for (j = 0; j < trafBoxes.length; j++) {
                var trafBox = trafBoxes[j];
                // exactly one tfhd per traf
                var tfhdBox = trafBox.getChildBox('tfhd');
                // zero or one tfdt per traf
                var tfdtBox = trafBox.getChildBox('tfdt');
                sampleDts = tfdtBox.baseMediaDecodeTime;
                // zero or more truns per traf
                var trunBoxes = trafBox.getChildBoxes('trun');
                // zero or more subs per traf
                var subsBoxes = trafBox.getChildBoxes('subs');
                for (k = 0; k < trunBoxes.length; k++) {
                    var trunBox = trunBoxes[k];
                    sampleCount = trunBox.sample_count;
                    dataOffset = (tfhdBox.base_data_offset || 0) + (trunBox.data_offset || 0);

                    for (i = 0; i < sampleCount; i++) {
                        sample = trunBox.samples[i];
                        sampleDuration = sample.sample_duration !== undefined ? sample.sample_duration : tfhdBox.default_sample_duration;
                        sampleSize = sample.sample_size !== undefined ? sample.sample_size : tfhdBox.default_sample_size;
                        sampleCompositionTimeOffset = sample.sample_composition_time_offset !== undefined ? sample.sample_composition_time_offset : 0;
                        var sampleData = {
                            'dts': sampleDts,
                            'cts': sampleDts + sampleCompositionTimeOffset,
                            'duration': sampleDuration,
                            'offset': moofBox.offset + dataOffset,
                            'size': sampleSize,
                            'subSizes': [sampleSize]
                        };
                        if (subsBoxes) {
                            for (m = 0; m < subsBoxes.length; m++) {
                                var subsBox = subsBoxes[m];
                                if (subsIndex < subsBox.entry_count - 1 && i > nextSubsSample) {
                                    subsIndex++;
                                    nextSubsSample += subsBox.entries[subsIndex].sample_delta;
                                }
                                if (i == nextSubsSample) {
                                    sampleData.subSizes = [];
                                    var entry = subsBox.entries[subsIndex];
                                    for (n = 0; n < entry.subsample_count; n++) {
                                        sampleData.subSizes.push(entry.subsamples[n].subsample_size);
                                    }
                                }
                            }
                        }
                        sampleList.push(sampleData);
                        dataOffset += sampleSize;
                        sampleDts += sampleDuration;
                    }
                }
                totalDuration = sampleDts - tfdtBox.baseMediaDecodeTime;
            }
        }
        return { sampleList: sampleList, lastSequenceNumber: lastSequenceNumber, totalDuration: totalDuration, numSequences: numSequences };
    }

    function getMediaTimescaleFromMoov(ab) {
        var isoFile = parse(ab);
        var mdhdBox = isoFile ? isoFile.getBox('mdhd') : undefined;

        return mdhdBox ? mdhdBox.timescale : NaN;
    }

    function parseUint32(data, offset) {
        return data[offset + 3] >>> 0 | data[offset + 2] << 8 >>> 0 | data[offset + 1] << 16 >>> 0 | data[offset] << 24 >>> 0;
    }

    function parseIsoBoxType(data, offset) {
        return String.fromCharCode(data[offset++]) + String.fromCharCode(data[offset++]) + String.fromCharCode(data[offset++]) + String.fromCharCode(data[offset]);
    }

    function findInitRange(data) {
        var initRange = null;
        var start = undefined,
            end = undefined;

        var isoFile = parse(data);

        if (!isoFile) {
            return initRange;
        }

        var ftyp = isoFile.getBox('ftyp');
        var moov = isoFile.getBox('moov');

        logger.debug('Searching for initialization.');

        if (moov && moov.isComplete) {
            start = ftyp ? ftyp.offset : moov.offset;
            end = moov.offset + moov.size - 1;
            initRange = start + '-' + end;

            logger.debug('Found the initialization.  Range: ' + initRange);
        }

        return initRange;
    }

    /**
     * Real-time parsing (whenever data is loaded in the buffer payload) of the payload to capture the moof of a chunk
     * @param {array} types
     * @param {ArrayBuffer} buffer
     * @param {number} offset
     * @return {IsoBoxSearchInfo}
     */
    function parsePayload(types, buffer, offset) {
        if (offset === undefined) {
            offset = 0;
        }

        if (!buffer || offset + 8 >= buffer.byteLength) {
            return new _voIsoBoxSearchInfo2['default'](0, false);
        }

        var data = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
        var boxInfo = undefined;
        var lastCompletedOffset = 0;
        while (offset < data.byteLength) {
            var boxSize = parseUint32(data, offset);
            var boxType = parseIsoBoxType(data, offset + 4);

            if (boxSize === 0) {
                break;
            }

            if (offset + boxSize <= data.byteLength) {
                if (types.indexOf(boxType) >= 0) {
                    boxInfo = new _voIsoBoxSearchInfo2['default'](offset, true, boxSize, boxType);
                } else {
                    lastCompletedOffset = offset + boxSize;
                }
            }

            offset += boxSize;
        }

        if (!boxInfo) {
            return new _voIsoBoxSearchInfo2['default'](lastCompletedOffset, false);
        }

        return boxInfo;
    }

    instance = {
        parse: parse,
        findLastTopIsoBoxCompleted: findLastTopIsoBoxCompleted,
        getMediaTimescaleFromMoov: getMediaTimescaleFromMoov,
        getSamplesInfo: getSamplesInfo,
        findInitRange: findInitRange,
        parsePayload: parsePayload
    };

    setup();

    return instance;
}
BoxParser.__dashjs_factory_name = 'BoxParser';
exports['default'] = _coreFactoryMaker2['default'].getSingletonFactory(BoxParser);
module.exports = exports['default'];

},{"11":11,"2":2,"77":77,"85":85,"9":9}],76:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

/**
 * @module DefaultURLUtils
 * @description Provides utility functions for operating on URLs.
 * Initially this is simply a method to determine the Base URL of a URL, but
 * should probably include other things provided all over the place such as
 * determining whether a URL is relative/absolute, resolving two paths etc.
 * @ignore
 */
function DefaultURLUtils() {

    var resolveFunction = undefined;

    var schemeRegex = /^[a-z][a-z0-9+\-_.]*:/i;
    var httpUrlRegex = /^https?:\/\//i;
    var httpsUrlRegex = /^https:\/\//i;
    var originRegex = /^([a-z][a-z0-9+\-_.]*:\/\/[^\/]+)\/?/i;

    /**
     * Resolves a url given an optional base url
     * Uses window.URL to do the resolution.
     *
     * @param {string} url
     * @param {string} [baseUrl]
     * @return {string}
     * @memberof module:DefaultURLUtils
     * @instance
     * @private
     */
    var nativeURLResolver = function nativeURLResolver(url, baseUrl) {
        try {
            return new window.URL(url, baseUrl).toString();
        } catch (e) {
            return url;
        }
    };

    /**
     * Resolves a url given an optional base url
     * Does not resolve ./, ../ etc but will do enough to construct something
     * which will satisfy XHR etc when window.URL is not available ie
     * IE11/node etc.
     *
     * @param {string} url
     * @param {string} [baseUrl]
     * @return {string}
     * @memberof module:DefaultURLUtils
     * @instance
     * @private
     */
    var dumbURLResolver = function dumbURLResolver(url, baseUrl) {
        var baseUrlParseFunc = parseBaseUrl;

        if (!baseUrl) {
            return url;
        }

        if (!isRelative(url)) {
            return url;
        }

        if (isPathAbsolute(url)) {
            baseUrlParseFunc = parseOrigin;
        }

        if (isSchemeRelative(url)) {
            baseUrlParseFunc = parseScheme;
        }

        var base = baseUrlParseFunc(baseUrl);
        var joinChar = base.charAt(base.length - 1) !== '/' && url.charAt(0) !== '/' ? '/' : '';

        return [base, url].join(joinChar);
    };

    function setup() {
        try {
            var u = new window.URL('x', 'http://y'); //jshint ignore:line
            resolveFunction = nativeURLResolver;
        } catch (e) {
            // must be IE11/Node etc
        } finally {
            resolveFunction = resolveFunction || dumbURLResolver;
        }
    }

    /**
     * Returns a string that contains the Base URL of a URL, if determinable.
     * @param {string} url - full url
     * @return {string}
     * @memberof module:DefaultURLUtils
     * @instance
     */
    function parseBaseUrl(url) {
        var slashIndex = url.indexOf('/');
        var lastSlashIndex = url.lastIndexOf('/');

        if (slashIndex !== -1) {
            // if there is only '//'
            if (lastSlashIndex === slashIndex + 1) {
                return url;
            }

            if (url.indexOf('?') !== -1) {
                url = url.substring(0, url.indexOf('?'));
            }

            return url.substring(0, lastSlashIndex + 1);
        }

        return '';
    }

    /**
     * Returns a string that contains the scheme and origin of a URL,
     * if determinable.
     * @param {string} url - full url
     * @return {string}
     * @memberof module:DefaultURLUtils
     * @instance
     */
    function parseOrigin(url) {
        var matches = url.match(originRegex);

        if (matches) {
            return matches[1];
        }

        return '';
    }

    /**
     * Returns a string that contains the fragment of a URL without scheme,
     * if determinable.
     * @param {string} url - full url
     * @return {string}
     * @memberof module:DefaultURLUtils
     * @instance
     */
    function removeHostname(url) {
        var urlParts = /^(?:\w+\:\/\/)?([^\/]+)(.*)$/.exec(url); //[1] = host / [2] = path
        return urlParts[2].substring(1);
    }

    /**
     * Returns a string that contains the scheme of a URL, if determinable.
     * @param {string} url - full url
     * @return {string}
     * @memberof module:DefaultURLUtils
     * @instance
     */
    function parseScheme(url) {
        var matches = url.match(schemeRegex);

        if (matches) {
            return matches[0];
        }

        return '';
    }

    /**
     * Determines whether the url is relative.
     * @return {boolean}
     * @param {string} url
     * @memberof module:DefaultURLUtils
     * @instance
     */
    function isRelative(url) {
        return !schemeRegex.test(url);
    }

    /**
     * Determines whether the url is path-absolute.
     * @return {bool}
     * @param {string} url
     * @memberof module:DefaultURLUtils
     * @instance
     */
    function isPathAbsolute(url) {
        return isRelative(url) && url.charAt(0) === '/';
    }

    /**
     * Determines whether the url is scheme-relative.
     * @return {bool}
     * @param {string} url
     * @memberof module:DefaultURLUtils
     * @instance
     */
    function isSchemeRelative(url) {
        return url.indexOf('//') === 0;
    }

    /**
     * Determines whether the url is an HTTP-URL as defined in ISO/IEC
     * 23009-1:2014 3.1.15. ie URL with a fixed scheme of http or https
     * @return {bool}
     * @param {string} url
     * @memberof module:DefaultURLUtils
     * @instance
     */
    function isHTTPURL(url) {
        return httpUrlRegex.test(url);
    }

    /**
     * Determines whether the supplied url has https scheme
     * @return {bool}
     * @param {string} url
     * @memberof module:DefaultURLUtils
     * @instance
     */
    function isHTTPS(url) {
        return httpsUrlRegex.test(url);
    }

    /**
     * Resolves a url given an optional base url
     * @return {string}
     * @param {string} url
     * @param {string} [baseUrl]
     * @memberof module:DefaultURLUtils
     * @instance
     */
    function resolve(url, baseUrl) {
        return resolveFunction(url, baseUrl);
    }

    setup();

    var instance = {
        parseBaseUrl: parseBaseUrl,
        parseOrigin: parseOrigin,
        parseScheme: parseScheme,
        isRelative: isRelative,
        isPathAbsolute: isPathAbsolute,
        isSchemeRelative: isSchemeRelative,
        isHTTPURL: isHTTPURL,
        isHTTPS: isHTTPS,
        removeHostname: removeHostname,
        resolve: resolve
    };

    return instance;
}

DefaultURLUtils.__dashjs_factory_name = 'DefaultURLUtils';
exports['default'] = _coreFactoryMaker2['default'].getSingletonFactory(DefaultURLUtils);
module.exports = exports['default'];

},{"11":11}],77:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _voIsoBox = _dereq_(84);

var _voIsoBox2 = _interopRequireDefault(_voIsoBox);

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

function IsoFile() {

    var instance = undefined,
        parsedIsoFile = undefined;

    /**
    * @param {string} type
    * @returns {IsoBox|null}
    * @memberof IsoFile#
    */
    function getBox(type) {
        if (!type || !parsedIsoFile || !parsedIsoFile.boxes || parsedIsoFile.boxes.length === 0 || typeof parsedIsoFile.fetch !== 'function') return null;

        return convertToDashIsoBox(parsedIsoFile.fetch(type));
    }

    /**
    * @param {string} type
    * @returns {Array|null} array of {@link IsoBox}
    * @memberof IsoFile#
    */
    function getBoxes(type) {
        var boxes = [];

        if (!type || !parsedIsoFile || typeof parsedIsoFile.fetchAll !== 'function') {
            return boxes;
        }

        var boxData = parsedIsoFile.fetchAll(type);
        var box = undefined;

        for (var i = 0, ln = boxData.length; i < ln; i++) {
            box = convertToDashIsoBox(boxData[i]);

            if (box) {
                boxes.push(box);
            }
        }

        return boxes;
    }

    /**
    * @param {string} value
    * @memberof IsoFile#
    */
    function setData(value) {
        parsedIsoFile = value;
    }

    /**
    * @returns {IsoBox|null}
    * @memberof IsoFile#
    */
    function getLastBox() {
        if (!parsedIsoFile || !parsedIsoFile.boxes || !parsedIsoFile.boxes.length) return null;

        var type = parsedIsoFile.boxes[parsedIsoFile.boxes.length - 1].type;
        var boxes = getBoxes(type);

        return boxes.length > 0 ? boxes[boxes.length - 1] : null;
    }

    function convertToDashIsoBox(boxData) {
        if (!boxData) return null;

        var box = new _voIsoBox2['default'](boxData);

        if (boxData.hasOwnProperty('_incomplete')) {
            box.isComplete = !boxData._incomplete;
        }

        return box;
    }

    instance = {
        getBox: getBox,
        getBoxes: getBoxes,
        setData: setData,
        getLastBox: getLastBox
    };

    return instance;
}
IsoFile.__dashjs_factory_name = 'IsoFile';
exports['default'] = _coreFactoryMaker2['default'].getClassFactory(IsoFile);
module.exports = exports['default'];

},{"11":11,"84":84}],78:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _fastDeepEqual = _dereq_(3);

var _fastDeepEqual2 = _interopRequireDefault(_fastDeepEqual);

/**
 * @module ObjectUtils
 * @ignore
 * @description Provides utility functions for objects
 */
function ObjectUtils() {

  var instance = undefined;

  /**
   * Returns true if objects are equal
   * @return {boolean}
   * @param {object} obj1
   * @param {object} obj2
   * @memberof module:ObjectUtils
   * @instance
   */
  function areEqual(obj1, obj2) {
    return (0, _fastDeepEqual2['default'])(obj1, obj2);
  }

  instance = {
    areEqual: areEqual
  };

  return instance;
}

ObjectUtils.__dashjs_factory_name = 'ObjectUtils';
exports['default'] = _coreFactoryMaker2['default'].getSingletonFactory(ObjectUtils);
module.exports = exports['default'];

},{"11":11,"3":3}],79:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

function RequestModifier() {

    var instance = undefined;

    function modifyRequestURL(url) {
        return url;
    }

    function modifyRequestHeader(request) {
        return request;
    }

    instance = {
        modifyRequestURL: modifyRequestURL,
        modifyRequestHeader: modifyRequestHeader
    };

    return instance;
}

RequestModifier.__dashjs_factory_name = 'RequestModifier';
exports['default'] = _coreFactoryMaker2['default'].getSingletonFactory(RequestModifier);
module.exports = exports['default'];

},{"11":11}],80:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreFactoryMaker = _dereq_(11);

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _DefaultURLUtils = _dereq_(76);

var _DefaultURLUtils2 = _interopRequireDefault(_DefaultURLUtils);

/**
 * @module URLUtils
 * @ignore
 * @description Provides utility functions for operating on URLs.
 * Initially this is simply a method to determine the Base URL of a URL, but
 * should probably include other things provided all over the place such as
 * determining whether a URL is relative/absolute, resolving two paths etc.
 */
function URLUtils() {

    var instance = undefined;
    var defaultURLUtils = undefined;
    var regexUtils = [];
    var context = this.context;

    function getUtils(url) {
        var i = undefined;
        for (i = 0; i < regexUtils.length; i++) {
            var regex = regexUtils[i].regex;
            if (regex.test(url)) {
                return regexUtils[i].utils;
            }
        }
        return defaultURLUtils;
    }

    function setup() {
        defaultURLUtils = (0, _DefaultURLUtils2['default'])(context).getInstance();
    }

    /**
     * Register a module to handle specific url.
     * @param {regex} regex - url regex
     * @param {object} utils - object that handles the regex
     * @memberof module:URLUtils
     * @instance
     */
    function registerUrlRegex(regex, utils) {
        regexUtils.push({ regex: regex, utils: utils });
    }

    function internalCall(functionName, url, baseUrl) {
        var utils = getUtils(baseUrl || url);
        return utils && typeof utils[functionName] === 'function' ? utils[functionName](url, baseUrl) : defaultURLUtils[functionName](url, baseUrl);
    }

    /**
     * Returns a string that contains the Base URL of a URL, if determinable.
     * @param {string} url - full url
     * @return {string}
     * @memberof module:URLUtils
     * @instance
     */
    function parseBaseUrl(url) {
        return internalCall('parseBaseUrl', url);
    }

    /**
     * Returns a string that contains the scheme and origin of a URL,
     * if determinable.
     * @param {string} url - full url
     * @return {string}
     * @memberof module:URLUtils
     * @instance
     */
    function parseOrigin(url) {
        return internalCall('parseOrigin', url);
    }

    /**
     * Returns a string that contains the fragment of a URL without scheme,
     * if determinable.
     * @param {string} url - full url
     * @return {string}
     * @memberof module:URLUtils
     * @instance
     */
    function removeHostname(url) {
        return internalCall('removeHostname', url);
    }

    /**
     * Returns a string that contains the scheme of a URL, if determinable.
     * @param {string} url - full url
     * @return {string}
     * @memberof module:URLUtils
     * @instance
     */
    function parseScheme(url) {
        return internalCall('parseScheme', url);
    }

    /**
     * Determines whether the url is relative.
     * @return {boolean}
     * @param {string} url
     * @memberof module:URLUtils
     * @instance
     */
    function isRelative(url) {
        return internalCall('isRelative', url);
    }

    /**
     * Determines whether the url is path-absolute.
     * @return {bool}
     * @param {string} url
     * @memberof module:URLUtils
     * @instance
     */
    function isPathAbsolute(url) {
        return internalCall('isPathAbsolute', url);
    }

    /**
     * Determines whether the url is scheme-relative.
     * @return {bool}
     * @param {string} url
     * @memberof module:URLUtils
     * @instance
     */
    function isSchemeRelative(url) {
        return internalCall('isSchemeRelative', url);
    }

    /**
     * Determines whether the url is an HTTP-URL as defined in ISO/IEC
     * 23009-1:2014 3.1.15. ie URL with a fixed scheme of http or https
     * @return {bool}
     * @param {string} url
     * @memberof module:URLUtils
     * @instance
     */
    function isHTTPURL(url) {
        return internalCall('isHTTPURL', url);
    }

    /**
     * Determines whether the supplied url has https scheme
     * @return {bool}
     * @param {string} url
     * @memberof module:URLUtils
     * @instance
     */
    function isHTTPS(url) {
        return internalCall('isHTTPS', url);
    }

    /**
     * Resolves a url given an optional base url
     * @return {string}
     * @param {string} url
     * @param {string} [baseUrl]
     * @memberof module:URLUtils
     * @instance
     */
    function resolve(url, baseUrl) {
        return internalCall('resolve', url, baseUrl);
    }

    setup();
    instance = {
        registerUrlRegex: registerUrlRegex,
        parseBaseUrl: parseBaseUrl,
        parseOrigin: parseOrigin,
        parseScheme: parseScheme,
        isRelative: isRelative,
        isPathAbsolute: isPathAbsolute,
        isSchemeRelative: isSchemeRelative,
        isHTTPURL: isHTTPURL,
        isHTTPS: isHTTPS,
        removeHostname: removeHostname,
        resolve: resolve
    };

    return instance;
}

URLUtils.__dashjs_factory_name = 'URLUtils';
var factory = _coreFactoryMaker2['default'].getSingletonFactory(URLUtils);
exports['default'] = factory;
module.exports = exports['default'];

},{"11":11,"76":76}],81:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DashJSError = function DashJSError(code, message, data) {
  _classCallCheck(this, DashJSError);

  this.code = code || null;
  this.message = message || null;
  this.data = data || null;
};

exports["default"] = DashJSError;
module.exports = exports["default"];

},{}],82:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _voMetricsHTTPRequest = _dereq_(87);

/**
 * @class
 * @ignore
 */

var FragmentRequest = (function () {
    function FragmentRequest(url) {
        _classCallCheck(this, FragmentRequest);

        this.action = FragmentRequest.ACTION_DOWNLOAD;
        this.startTime = NaN;
        this.mediaStartTime = NaN;
        this.mediaType = null;
        this.mediaInfo = null;
        this.type = null;
        this.duration = NaN;
        this.timescale = NaN;
        this.range = null;
        this.url = url || null;
        this.serviceLocation = null;
        this.requestStartDate = null;
        this.firstByteDate = null;
        this.requestEndDate = null;
        this.quality = NaN;
        this.index = NaN;
        this.availabilityStartTime = null;
        this.availabilityEndTime = null;
        this.wallStartTime = null;
        this.bytesLoaded = NaN;
        this.bytesTotal = NaN;
        this.delayLoadingTime = NaN;
        this.responseType = 'arraybuffer';
        this.representationId = null;
    }

    _createClass(FragmentRequest, [{
        key: 'isInitializationRequest',
        value: function isInitializationRequest() {
            return this.type && this.type === _voMetricsHTTPRequest.HTTPRequest.INIT_SEGMENT_TYPE;
        }
    }, {
        key: 'setInfo',
        value: function setInfo(info) {
            this.type = info && info.init ? _voMetricsHTTPRequest.HTTPRequest.INIT_SEGMENT_TYPE : _voMetricsHTTPRequest.HTTPRequest.MEDIA_SEGMENT_TYPE;
            this.url = info && info.url ? info.url : null;
            this.range = info && info.range ? info.range.start + '-' + info.range.end : null;
            this.mediaType = info && info.mediaType ? info.mediaType : null;
        }
    }]);

    return FragmentRequest;
})();

FragmentRequest.ACTION_DOWNLOAD = 'download';
FragmentRequest.ACTION_COMPLETE = 'complete';

exports['default'] = FragmentRequest;
module.exports = exports['default'];

},{"87":87}],83:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _FragmentRequest2 = _dereq_(82);

var _FragmentRequest3 = _interopRequireDefault(_FragmentRequest2);

var HeadRequest = (function (_FragmentRequest) {
  _inherits(HeadRequest, _FragmentRequest);

  function HeadRequest(url) {
    _classCallCheck(this, HeadRequest);

    _get(Object.getPrototypeOf(HeadRequest.prototype), 'constructor', this).call(this, url);
    this.checkForExistenceOnly = true;
  }

  return HeadRequest;
})(_FragmentRequest3['default']);

exports['default'] = HeadRequest;
module.exports = exports['default'];

},{"82":82}],84:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var IsoBox = (function () {
    function IsoBox(boxData) {
        _classCallCheck(this, IsoBox);

        this.offset = boxData._offset;
        this.type = boxData.type;
        this.size = boxData.size;
        this.boxes = [];
        if (boxData.boxes) {
            for (var i = 0; i < boxData.boxes.length; i++) {
                this.boxes.push(new IsoBox(boxData.boxes[i]));
            }
        }
        this.isComplete = true;

        switch (boxData.type) {
            case 'sidx':
                this.timescale = boxData.timescale;
                this.earliest_presentation_time = boxData.earliest_presentation_time;
                this.first_offset = boxData.first_offset;
                this.references = boxData.references;
                if (boxData.references) {
                    this.references = [];
                    for (var i = 0; i < boxData.references.length; i++) {
                        var reference = {
                            reference_type: boxData.references[i].reference_type,
                            referenced_size: boxData.references[i].referenced_size,
                            subsegment_duration: boxData.references[i].subsegment_duration
                        };
                        this.references.push(reference);
                    }
                }
                break;
            case 'emsg':
                this.id = boxData.id;
                this.version = boxData.version === 1 ? 1 : 0;
                this.value = boxData.value;
                this.timescale = boxData.timescale;
                this.scheme_id_uri = boxData.scheme_id_uri;
                this.presentation_time_delta = boxData.version === 1 ? boxData.presentation_time : boxData.presentation_time_delta;
                this.event_duration = boxData.event_duration;
                this.message_data = boxData.message_data;
                break;
            case 'mdhd':
                this.timescale = boxData.timescale;
                break;
            case 'mfhd':
                this.sequence_number = boxData.sequence_number;
                break;
            case 'subs':
                this.entry_count = boxData.entry_count;
                this.entries = boxData.entries;
                break;
            case 'tfhd':
                this.base_data_offset = boxData.base_data_offset;
                this.sample_description_index = boxData.sample_description_index;
                this.default_sample_duration = boxData.default_sample_duration;
                this.default_sample_size = boxData.default_sample_size;
                this.default_sample_flags = boxData.default_sample_flags;
                this.flags = boxData.flags;
                break;
            case 'tfdt':
                this.version = boxData.version;
                this.baseMediaDecodeTime = boxData.baseMediaDecodeTime;
                this.flags = boxData.flags;
                break;
            case 'trun':
                this.sample_count = boxData.sample_count;
                this.first_sample_flags = boxData.first_sample_flags;
                this.data_offset = boxData.data_offset;
                this.flags = boxData.flags;
                this.samples = boxData.samples;
                if (boxData.samples) {
                    this.samples = [];
                    for (var i = 0, ln = boxData.samples.length; i < ln; i++) {
                        var sample = {
                            sample_size: boxData.samples[i].sample_size,
                            sample_duration: boxData.samples[i].sample_duration,
                            sample_composition_time_offset: boxData.samples[i].sample_composition_time_offset
                        };
                        this.samples.push(sample);
                    }
                }
                break;
        }
    }

    _createClass(IsoBox, [{
        key: 'getChildBox',
        value: function getChildBox(type) {
            for (var i = 0; i < this.boxes.length; i++) {
                if (this.boxes[i].type === type) {
                    return this.boxes[i];
                }
            }
        }
    }, {
        key: 'getChildBoxes',
        value: function getChildBoxes(type) {
            var boxes = [];
            for (var i = 0; i < this.boxes.length; i++) {
                if (this.boxes[i].type === type) {
                    boxes.push(this.boxes[i]);
                }
            }
            return boxes;
        }
    }]);

    return IsoBox;
})();

exports['default'] = IsoBox;
module.exports = exports['default'];

},{}],85:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var IsoBoxSearchInfo = function IsoBoxSearchInfo(lastCompletedOffset, found, size) {
  _classCallCheck(this, IsoBoxSearchInfo);

  this.lastCompletedOffset = lastCompletedOffset;
  this.found = found;
  this.size = size;
};

exports["default"] = IsoBoxSearchInfo;
module.exports = exports["default"];

},{}],86:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var ThumbnailTrackInfo = function ThumbnailTrackInfo() {
  _classCallCheck(this, ThumbnailTrackInfo);

  this.bitrate = 0;
  this.width = 0;
  this.height = 0;
  this.tilesHor = 0;
  this.tilesVert = 0;
  this.widthPerTile = 0;
  this.heightPerTile = 0;
  this.startNumber = 0;
  this.segmentDuration = 0;
  this.timescale = 0;
  this.templateUrl = '';
  this.id = '';
};

exports['default'] = ThumbnailTrackInfo;
module.exports = exports['default'];

},{}],87:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @classdesc This Object holds reference to the HTTPRequest for manifest, fragment and xlink loading.
 * Members which are not defined in ISO23009-1 Annex D should be prefixed by a _ so that they are ignored
 * by Metrics Reporting code.
 * @ignore
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var HTTPRequest =
/**
 * @class
 */
function HTTPRequest() {
  _classCallCheck(this, HTTPRequest);

  /**
   * Identifier of the TCP connection on which the HTTP request was sent.
   * @public
   */
  this.tcpid = null;
  /**
   * This is an optional parameter and should not be included in HTTP request/response transactions for progressive download.
   * The type of the request:
   * - MPD
   * - XLink expansion
   * - Initialization Fragment
   * - Index Fragment
   * - Media Fragment
   * - Bitstream Switching Fragment
   * - other
   * @public
   */
  this.type = null;
  /**
   * The original URL (before any redirects or failures)
   * @public
   */
  this.url = null;
  /**
   * The actual URL requested, if different from above
   * @public
   */
  this.actualurl = null;
  /**
   * The contents of the byte-range-spec part of the HTTP Range header.
   * @public
   */
  this.range = null;
  /**
   * Real-Time | The real time at which the request was sent.
   * @public
   */
  this.trequest = null;
  /**
   * Real-Time | The real time at which the first byte of the response was received.
   * @public
   */
  this.tresponse = null;
  /**
   * The HTTP response code.
   * @public
   */
  this.responsecode = null;
  /**
   * The duration of the throughput trace intervals (ms), for successful requests only.
   * @public
   */
  this.interval = null;
  /**
   * Throughput traces, for successful requests only.
   * @public
   */
  this.trace = [];

  /**
   * Type of stream ("audio" | "video" etc..)
   * @public
   */
  this._stream = null;
  /**
   * Real-Time | The real time at which the request finished.
   * @public
   */
  this._tfinish = null;
  /**
   * The duration of the media requests, if available, in seconds.
   * @public
   */
  this._mediaduration = null;
  /**
   * The media segment quality
   * @public
   */
  this._quality = null;
  /**
   * all the response headers from request.
   * @public
   */
  this._responseHeaders = null;
  /**
   * The selected service location for the request. string.
   * @public
   */
  this._serviceLocation = null;
}

/**
 * @classdesc This Object holds reference to the progress of the HTTPRequest.
 * @ignore
 */
;

var HTTPRequestTrace =
/**
* @class
*/
function HTTPRequestTrace() {
  _classCallCheck(this, HTTPRequestTrace);

  /**
   * Real-Time | Measurement stream start.
   * @public
   */
  this.s = null;
  /**
   * Measurement stream duration (ms).
   * @public
   */
  this.d = null;
  /**
   * List of integers counting the bytes received in each trace interval within the measurement stream.
   * @public
   */
  this.b = [];
};

HTTPRequest.GET = 'GET';
HTTPRequest.HEAD = 'HEAD';
HTTPRequest.MPD_TYPE = 'MPD';
HTTPRequest.XLINK_EXPANSION_TYPE = 'XLinkExpansion';
HTTPRequest.INIT_SEGMENT_TYPE = 'InitializationSegment';
HTTPRequest.INDEX_SEGMENT_TYPE = 'IndexSegment';
HTTPRequest.MEDIA_SEGMENT_TYPE = 'MediaSegment';
HTTPRequest.BITSTREAM_SWITCHING_SEGMENT_TYPE = 'BitstreamSwitchingSegment';
HTTPRequest.LICENSE = 'license';
HTTPRequest.OTHER_TYPE = 'other';

exports.HTTPRequest = HTTPRequest;
exports.HTTPRequestTrace = HTTPRequestTrace;

},{}]},{},[57])
//# sourceMappingURL=dash.offline.debug.js.map
