import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Voice processing request:", body);

    try {
      // Forward the request to our backend server
      const response = await fetch("http://localhost:5001/api/voice/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // If response is not OK, read text first to check what's wrong
        const errorText = await response.text();
        console.error("Backend error response:", errorText);

        // Try to parse as JSON if possible
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (jsonError) {
          // If can't parse as JSON, use the raw text
          return NextResponse.json(
            { error: `Server error: ${errorText}` },
            { status: response.status }
          );
        }

        return NextResponse.json(
          { error: errorData.error || "Server error" },
          { status: response.status }
        );
      }

      // For successful responses, parse JSON
      const dataText = await response.text();

      // Handle empty responses
      if (!dataText) {
        return NextResponse.json(
          { error: "Empty response from server" },
          { status: 500 }
        );
      }

      const data = JSON.parse(dataText);
      console.log("Voice processing response:", data);

      return NextResponse.json(data);
    } catch (fetchError: any) {
      console.error("Fetch error:", fetchError);
      return NextResponse.json(
        {
          error:
            "Unable to connect to the backend server. Make sure the server is running.",
          details: fetchError.message,
        },
        { status: 503 } // Service Unavailable
      );
    }
  } catch (error: any) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
