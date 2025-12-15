import sqlite3

import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import pandas as pd

# --- CONFIGURATION ---
DB_FILE = "railtracker.db"


def plot_prices():
    # 1. Connect to the database
    conn = sqlite3.connect(DB_FILE)

    # 2. Load data into a Pandas DataFrame
    query = """
        SELECT fetch_timestamp, train_name, price_amount, journey_date, departure_time 
        FROM prices
        ORDER BY fetch_timestamp ASC
    """
    try:
        df = pd.read_sql_query(query, conn)
    except pd.errors.DatabaseError:
        print("Error reading database. Make sure 'tracker.js' has run at least once.")
        return
    finally:
        conn.close()

    if df.empty:
        print("Database is empty. Run 'tracker.js' first!")
        return

    # 3. Preprocessing
    # Convert string timestamps to actual datetime objects
    df["fetch_timestamp"] = pd.to_datetime(df["fetch_timestamp"])

    # Create a clean label for the legend (Train Name + Time)
    # e.g., "ICE 567 (08:10)"
    df["departure_time"] = pd.to_datetime(df["departure_time"])
    df["label"] = (
        df["train_name"] + " (" + df["departure_time"].dt.strftime("%H:%M") + ")"
    )

    # 4. Plotting
    plt.figure(figsize=(12, 6))

    # Group by specific train connection so we can plot each line separately
    for label, group in df.groupby("label"):
        plt.plot(
            group["fetch_timestamp"], group["price_amount"], marker="o", label=label
        )

    # Formatting the Graph
    plt.title(f"Price Trend: Karlsruhe -> Munich ({df['journey_date'].iloc[0]})")
    plt.xlabel("Date/Time Checked")
    plt.ylabel("Price (EUR)")
    plt.grid(True, which="both", linestyle="--", linewidth=0.5)
    plt.legend(title="Connections")

    # Format X-Axis to show dates nicely
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter("%d.%m %H:%M"))
    plt.gcf().autofmt_xdate()  # Rotate dates slightly

    plt.tight_layout()

    # Show the plot
    print("Opening plot window...")
    plt.show()


if __name__ == "__main__":
    plot_prices()
