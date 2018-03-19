from channels import include

channel_routing = [
    # Include subrouting from an app with predefined path matching.
    #Be very carefull with these routing.py otherwise all RealTime stuff will stop.
    include("bootcamp.activities.routing.websocket_routing",
            path=r"^/ws/notifications/$"),
    include("bootcamp.feeds.routing.websocket_routing", path=r"^/ws/feeds/$"),
    include("bootcamp.messenger.routing.websocket_routing",
            path=r"^/ws")
]
