{% load static %}
<!DOCTYPE html> 
<meta http-equiv="Content-Type" content="text/html;charset=UTF-8" />
<meta name="viewport" content="initial-scale=1, minimum-scale=1" />
<title>{% if title %}{{title}} &mdash; {% endif %}Washboard</title>
<link rel="stylesheet" type="text/css" href="{% static "css/washboard.css" %}" />
<link rel="stylesheet" type="text/css" href="{% static "css/jquery.dropdown.css" %}" />
<script type="text/javascript" src="{% static "js/jquery.min.js" %}"></script>
<script type="text/javascript" src="{% static "js/jquery.fix.clone.js" %}"></script>
<script type="text/javascript" src="{% static "js/jquery.dropdown.js" %}"></script>
<script type="text/javascript" src="{% static "js/washboard.js" %}"></script>
{% block head %}{% endblock %}

<div id="top" class="wrapper">
    <div>
        <div id="nav">
            <h1 id="title">{% if title %}{{ title }}{% else %}Washboard{% endif %}</h1>
            <div id="menu">
                <ul>
                    <li><a href="/dash">Dashboard</a></li>
                    <li><a href="/rules">Rules</a></li>
                    <li><a href="/settings">Settings</a></li>
                    <li><a href="/logout">Logout</a></li>
                </ul>
            </div>
        </div>
    </div>
</div>

<div id="middle" class="wrapper">
    <div>
        {% if messages %}
        <ul id="messages">
            {% for message in messages %}
            <li{% if message.tags %} class="{{ message.tags }}"{% endif %}>{{ message }}</li>
            {% endfor %}
        </ul>
        {% endif %}
        {% if not dash %}
        <div id="content">
            {% block content %}{% endblock %}
        </div>
        {% else %}
        <noscript>
            <p>Sorry, your browser does not have JavaScript enabled. (Maybe it's turned off?)</p>
        </noscript>
        {% endif %}
    </div>
</div>

<div id="bottom" class="wrapper">
    <div>
    </div>
</div>
