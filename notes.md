## Open Questions:
How can I save static image files from the web app?
```python
import dash
import dash_core_components as dcc
import dash_html_components as html
import plotly.express as px

app = dash.Dash(__name__)

# Sample data
data = px.data.iris()

# Create a Dash web app layout
app.layout = html.Div([
    dcc.Graph(
        id='scatter-plot',
        figure=px.scatter(data, x='sepal_width', y='sepal_length', color='species')
    ),
    html.Button('Save Image', id='save-image-button'),
    html.Img(id='output-image')
])

@app.callback(
    dash.dependencies.Output('output-image', 'src'),
    [dash.dependencies.Input('save-image-button', 'n_clicks')],
)
def save_image(n_clicks):
    if n_clicks is None:
        return dash.no_update

    # Generate a static image of the plot and save it
    fig = px.scatter(data, x='sepal_width', y='sepal_length', color='species')
    fig.write_image("static_plot.png")

    # Provide the path to the saved image to the HTML img tag
    return app.get_asset_url("static_plot.png")

if __name__ == '__main__':
    app.run_server(debug=True)
```

How can I output to email?
 - Can use the `smtplib` library for sending emails and the `email` library for composing the email

```python
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Email configuration
sender_email = 'your_email@gmail.com'
sender_password = 'your_email_password'
receiver_email = 'recipient_email@example.com'
subject = 'Subject of the email'

# Create the MIME object
message = MIMEMultipart()
message['From'] = sender_email
message['To'] = receiver_email
message['Subject'] = subject

# Email body
body = 'Hello, this is the body of the email.'
message.attach(MIMEText(body, 'plain'))

# Establish a connection to the SMTP server
with smtplib.SMTP('smtp.gmail.com', 587) as server:
    server.starttls()
    
    # Login to the email account
    server.login(sender_email, sender_password)
    
    # Send the email
    server.sendmail(sender_email, receiver_email, message.as_string())
    
print('Email sent successfully!')
```

How do I connect to the database?
 - Import database such as sqlite
 - Connect to database

```python
import sqlite3

conn = sqlite3.connect('your_database.db')
import pandas as pd

query = "SELECT * FROM your_table"
df = pd.read_sql_query(query, conn)
```


ad_spend = [10105, 6210, 4580, 5030, 6996, 6156, 7214, 6753]
revenue = [57435, 57435, 51871, 46052, 45926, 50443, 59107]
