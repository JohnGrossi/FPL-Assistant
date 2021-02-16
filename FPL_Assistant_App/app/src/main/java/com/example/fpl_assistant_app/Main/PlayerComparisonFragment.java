package com.example.fpl_assistant_app.Main;

import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Spinner;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;

import com.example.fpl_assistant_app.R;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.firestore.CollectionReference;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import com.google.firebase.firestore.QuerySnapshot;

import java.util.List;

/**
 * A simple {@link Fragment} subclass.
 * Use the {@link PlayerComparisonFragment#newInstance} factory method to
 * create an instance of this fragment.
 */
public class PlayerComparisonFragment extends Fragment implements AdapterView.OnItemSelectedListener {

    public PlayerComparisonFragment() {
        // Required empty public constructor
    }

    /**
     * Use this factory method to create a new instance of
     * this fragment using the provided parameters.
     *
     * @return A new instance of fragment PlayerComparisonFragment.
     */
    // TODO: Rename and change types and number of parameters
    public static PlayerComparisonFragment newInstance(String param1, String param2) {
        PlayerComparisonFragment fragment = new PlayerComparisonFragment();
        Bundle args = new Bundle();
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        View view = inflater.inflate(R.layout.fragment_player_comparison, container, false);
        String teams[] = getResources().getStringArray(R.array.teams);

        Spinner spinner = (Spinner) view.findViewById(R.id.spinner1);
        ArrayAdapter<CharSequence> adapter = new ArrayAdapter<CharSequence>(this.getActivity(), android.R.layout.simple_spinner_item, teams);
        adapter.setDropDownViewResource(android.R.layout.simple_dropdown_item_1line);
        spinner.setAdapter(adapter);
        spinner.setOnItemSelectedListener(this);

        return view;
    }

    @Override
    public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
        Log.d("big man tag", "got HERE");
        FirebaseFirestore db = FirebaseFirestore.getInstance();
        CollectionReference collectionRef = db.collection("teams").document(((String) parent.getItemAtPosition(position)).toUpperCase()).collection("players");
        Log.d("HERE", (String) parent.getItemAtPosition(position));
        collectionRef.get().addOnSuccessListener(new OnSuccessListener<QuerySnapshot>() {
            @Override
            public void onSuccess(QuerySnapshot queryDocumentSnapshots) {
                    List<DocumentSnapshot> snapshotList = queryDocumentSnapshots.getDocuments();
                    for(DocumentSnapshot snapshot: snapshotList) {
                        Log.d("big man tag", "onSuccess: " + snapshot.getId());
                    }
            }
        });
    }
    @Override
    public void onNothingSelected(AdapterView<?> parent) {

    }
}