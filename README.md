# twine-client-js
A client for subscribing to translations from twine

# install
`npm install twine-client`

# example usage
```html
<!DOCTYPE html>
<html>
<head>
  <script src="node_modules/twine-client/dist/twine-client.js"></script>
  <script type="text/javascript">
        // Connect to a Meteor backend
      var client = new TwineClient({endpoint: 'localhost:3000', username: 'admin', password: 'admin', bundleId: 'kmsdfsk44455srt', useLatestVersion: true});

      client.onChange(function(data) {
        document.body.innerHTML = '<pre>' + JSON.stringify(data, true, '    ') + '</pre>';
      });

      client.onError(function(error) {
        console.error(error);
      });

      client.connect().done();
  </script>
</head>

<body>

</body>
</html>
```
