# run-activation.py
import json, os

def activate_engine(mode="automatic"):
    activation_types = [
        "manual", "automatic", "conditional",
        "tiered", "lane-based", "domain-based", "state-based"
    ]
    if mode not in activation_types:
        raise ValueError("Invalid activation type")

    print(f"Activating Whole Donuts ecosystem in {mode} mode...")
    # Load environment variables or config
    os.environ["WD_ENGINE_STATE"] = "ACTIVE"
    os.environ["WD_ACTIVATION_MODE"] = mode
    # Trigger visuals, buttons, actions
    print("Buttons, visuals, and actions are now live.")

if __name__ == "__main__":
    activate_engine("automatic")
