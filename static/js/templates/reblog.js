function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div id=\"reblog_";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" class=\"action-box reblog-box closed\">\n    <textarea class=\"section caption\" placeholder=\"Caption\"></textarea>\n    <input class=\"section tags\" placeholder=\"Tags (comma-separated)\" />\n    <div class=\"section controls\">\n        <button class=\"shiny choosestate\" data-dropdown=\"#choosestate_";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">Publish</button>\n        <span class=\"on\">on</span>\n        <button class=\"shiny chooseblog\" data-dropdown=\"#chooseblog_";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.username) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.username; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</button>\n        <button class=\"shiny media twitter ";
  if (stack1 = helpers.twitter) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.twitter; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" onclick=\"Washboard.toggle_media('twitter', ";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ")\"><a></a></button>\n        <button class=\"shiny media facebook ";
  if (stack1 = helpers.facebook) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.facebook; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" onclick=\"Washboard.toggle_media('facebook', ";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ")\"><a></a></button>\n        <input class=\"shiny\" type=\"submit\" value=\"Reblog\" onclick=\"Washboard.submit_reblog(";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ")\" />\n    </div>\n</div>\n\n";
  return buffer;
  }