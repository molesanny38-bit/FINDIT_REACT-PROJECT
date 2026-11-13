import { useEffect, useState } from "react";

import {
  getClaims,
  reviewClaim,
  markClaimAsReturned,
  getReturnHistory,
  type Claim,
  type ItemReturn,
} from "../services/claimeService";

function Claims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [returns, setReturns] = useState<ItemReturn[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Return modal states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [receiverName, setReceiverName] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [processingReturn, setProcessingReturn] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Get logged-in user
  const currentUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  // Check user role
  const canReview =
    currentUser.role === "staff" ||
    currentUser.role === "admin";

  // ==========================================
  // LOAD CLAIMS AND RETURN HISTORY
  // ==========================================
  const loadClaims = async () => {
    try {
      setLoading(true);
      setError("");

      const [claimsData, returnData] = await Promise.all([
        getClaims(),
        getReturnHistory(),
      ]);

      setClaims(claimsData);
      setReturns(returnData);
    } catch (err) {
      console.error("Failed to load claims or returns:", err);
      setError("Failed to load claims. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  // ==========================================
  // FORMAT DATE
  // ==========================================
  const formatDate = (date: string | null) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString();
  };

  // ==========================================
  // REVIEW CLAIM
  // ==========================================
  const handleReview = async (
    id: number,
    status: "approved" | "rejected"
  ) => {
    const confirmation = window.confirm(
      `Are you sure you want to ${status} this claim?`
    );

    if (!confirmation) return;

    try {
      setMessage("");
      setError("");

      await reviewClaim(id, status);

      setMessage(
        `Claim #${id} has been ${status} successfully!`
      );

      await loadClaims();
    } catch (err) {
      console.error("Failed to review claim:", err);
      setError("Failed to update claim. Please try again.");
    }
  };

  // ==========================================
  // OPEN RETURN MODAL
  // ==========================================
  const openReturnModal = (claim: Claim) => {
    setSelectedClaim(claim);

    setReceiverName(
      `${claim.first_name} ${claim.last_name}`.trim()
    );

    setReturnNotes("");
    setMessage("");
    setError("");
    setShowReturnModal(true);
  };

  // ==========================================
  // CLOSE RETURN MODAL
  // ==========================================
  const closeReturnModal = () => {
    if (processingReturn) return;

    setShowReturnModal(false);
    setSelectedClaim(null);
    setReceiverName("");
    setReturnNotes("");
  };

  // ==========================================
  // PROCESS ITEM RETURN
  // ==========================================
  const handleReturn = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!selectedClaim) return;

    if (!receiverName.trim()) {
      setError("Please enter the receiver's name.");
      return;
    }

    const confirmation = window.confirm(
      `Confirm that "${selectedClaim.item_name}" has been returned to ${receiverName}?`
    );

    if (!confirmation) return;

    try {
      setProcessingReturn(true);
      setError("");
      setMessage("");

      await markClaimAsReturned(
        selectedClaim.claim_id,
        receiverName,
        returnNotes
      );

      setMessage(
        `Item "${selectedClaim.item_name}" has been successfully returned!`
      );

      setShowReturnModal(false);
      setSelectedClaim(null);
      setReceiverName("");
      setReturnNotes("");

      await loadClaims();
    } catch (err: any) {
      console.error("Failed to process return:", err);

      setError(
        err.response?.data?.message ||
          "Failed to process item return. Please try again."
      );
    } finally {
      setProcessingReturn(false);
    }
  };

  // ==========================================
  // FILTER CLAIMS
  // ==========================================
  const filteredClaims = claims.filter((claim) => {
    const search = searchTerm.toLowerCase().trim();

    const claimantName =
      `${claim.first_name} ${claim.last_name}`.toLowerCase();

    const matchesSearch =
      claim.item_name.toLowerCase().includes(search) ||
      claimantName.includes(search) ||
      claim.claim_description.toLowerCase().includes(search) ||
      claim.claim_id.toString().includes(search);

    const matchesStatus =
      statusFilter === "all" ||
      claim.claim_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ==========================================
  // PAGINATION
  // ==========================================
  const totalPages = Math.ceil(
    filteredClaims.length / itemsPerPage
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedClaims = filteredClaims.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // ==========================================
  // SUMMARY COUNTS
  // ==========================================
  const pendingCount = claims.filter(
    (claim) => claim.claim_status === "pending"
  ).length;

  const approvedCount = claims.filter(
    (claim) => claim.claim_status === "approved"
  ).length;

  const rejectedCount = claims.filter(
    (claim) => claim.claim_status === "rejected"
  ).length;

  // ==========================================
  // USER INTERFACE
  // ==========================================
  return (
    <div className="claims-page">

      {/* PAGE HEADER */}
      <div className="claims-header">
        <div>
          <h1>
            {canReview ? "Claims Management" : "My Claims"}
          </h1>

          <p>
            {canReview
              ? "Review claims and manage item returns."
              : "Track your submitted claims and returned items."}
          </p>
        </div>

        <button
          onClick={loadClaims}
          className="refresh-button"
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* SUCCESS MESSAGE */}
      {message && (
        <p className="success-message">
          {message}
        </p>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      {/* SUMMARY CARDS */}
      <div className="claims-summary">

        <div className="claim-card">
          <h3>Total Claims</h3>
          <h2>{claims.length}</h2>
        </div>

        <div className="claim-card">
          <h3>Pending</h3>
          <h2>{pendingCount}</h2>
        </div>

        <div className="claim-card">
          <h3>Approved</h3>
          <h2>{approvedCount}</h2>
        </div>

        <div className="claim-card">
          <h3>Rejected</h3>
          <h2>{rejectedCount}</h2>
        </div>

      </div>

      {/* SUBMITTED CLAIMS */}
      <div className="claims-table-container">

        <h2>
          {canReview ? "Submitted Claims" : "My Submitted Claims"}
        </h2>

        {/* SEARCH AND FILTER */}
        <div className="claims-controls">

          <input
            type="text"
            placeholder="Search item, claimant, description, or ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="claims-search"
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="claims-filter"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>

        </div>

        {loading ? (
          <p>Loading claims...</p>
        ) : filteredClaims.length === 0 ? (
          <p>No matching claims found.</p>
        ) : (

          <>
            <table className="claims-table">

              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Item Name</th>

                  {canReview && (
                    <th>Claimant</th>
                  )}

                  <th>Description</th>
                  <th>Date Submitted</th>
                  <th>Status</th>
                  <th>Date Reviewed</th>

                  {canReview && (
                    <th>Actions</th>
                  )}
                </tr>
              </thead>

              <tbody>

                {paginatedClaims.map((claim) => (

                  <tr key={claim.claim_id}>

                    <td>
                      #{claim.claim_id}
                    </td>

                    <td>
                      {claim.item_name}
                    </td>

                    {canReview && (
                      <td>
                        {claim.first_name} {claim.last_name}
                      </td>
                    )}

                    <td>
                      {claim.claim_description}
                    </td>

                    <td>
                      {formatDate(claim.created_at)}
                    </td>

                    <td>
                      <span
                        className={`claim-status ${claim.claim_status}`}
                      >
                        {claim.claim_status.toUpperCase()}
                      </span>
                    </td>

                    <td>
                      {formatDate(claim.reviewed_at)}
                    </td>

                    {canReview && (
                      <td>
                        {claim.claim_status === "pending" ? (

                          <div className="claim-actions">

                            <button
                              type="button"
                              className="approve-button"
                              onClick={() =>
                                handleReview(
                                  claim.claim_id,
                                  "approved"
                                )
                              }
                            >
                              Approve
                            </button>

                            <button
                              type="button"
                              className="reject-button"
                              onClick={() =>
                                handleReview(
                                  claim.claim_id,
                                  "rejected"
                                )
                              }
                            >
                              Reject
                            </button>

                          </div>

                        ) : claim.claim_status === "approved" ? (

                          <button
                            type="button"
                            className="approve-button"
                            onClick={() => openReturnModal(claim)}
                          >
                            Mark as Returned
                          </button>

                        ) : (
                          <span>Reviewed</span>
                        )}
                      </td>
                    )}

                  </tr>

                ))}

              </tbody>

            </table>

            {/* PAGINATION */}
            <div className="claims-pagination">

              <p>
                Showing {startIndex + 1} to{" "}
                {Math.min(
                  startIndex + itemsPerPage,
                  filteredClaims.length
                )}{" "}
                of {filteredClaims.length} claims
              </p>

              <div className="pagination-buttons">

                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => page - 1)
                  }
                >
                  Previous
                </button>

                <span>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((page) => page + 1)
                  }
                >
                  Next
                </button>

              </div>

            </div>
          </>
        )}

      </div>

      {/* RETURN HISTORY */}
      <div className="claims-table-container">

        <h2>
          {canReview ? "Item Return History" : "My Returned Items"}
        </h2>

        {loading ? (
          <p>Loading return history...</p>
        ) : returns.length === 0 ? (
          <p>No returned items recorded yet.</p>
        ) : (

          <table className="claims-table">

            <thead>
              <tr>
                <th>Return ID</th>
                <th>Item Name</th>

                {canReview && (
                  <th>Receiver</th>
                )}

                <th>Return Notes</th>
                <th>Returned By</th>
                <th>Date Returned</th>
              </tr>
            </thead>

            <tbody>

              {returns.map((itemReturn) => (

                <tr key={itemReturn.return_id}>

                  <td>
                    #{itemReturn.return_id}
                  </td>

                  <td>
                    {itemReturn.item_name}
                  </td>

                  {canReview && (
                    <td>
                      {itemReturn.receiver_name}
                    </td>
                  )}

                  <td>
                    {itemReturn.return_notes || "No notes"}
                  </td>

                  <td>
                    {itemReturn.staff_first_name}{" "}
                    {itemReturn.staff_last_name}
                  </td>

                  <td>
                    {formatDate(itemReturn.returned_at)}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>

      {/* RETURN MODAL */}
      {showReturnModal && selectedClaim && (

        <div className="return-modal-overlay">

          <div className="return-modal">

            <h2>Record Item Return</h2>

            <p>
              Item: <strong>{selectedClaim.item_name}</strong>
            </p>

            <form onSubmit={handleReturn}>

              <div className="form-group">

                <label htmlFor="receiverName">
                  Receiver's Name
                </label>

                <input
                  id="receiverName"
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Enter receiver's name"
                  required
                />

              </div>

              <div className="form-group">

                <label htmlFor="returnNotes">
                  Return Notes (Optional)
                </label>

                <textarea
                  id="returnNotes"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Enter additional return details"
                  rows={4}
                />

              </div>

              <div className="return-modal-actions">

                <button
                  type="button"
                  className="reject-button"
                  onClick={closeReturnModal}
                  disabled={processingReturn}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="approve-button"
                  disabled={processingReturn}
                >
                  {processingReturn
                    ? "Processing..."
                    : "Confirm Return"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Claims;